#Requires -Version 5.1
<#
.SYNOPSIS
    Deploy DevEdu to a local Kind cluster using Podman.

.DESCRIPTION
    Builds the backend image with Podman, pushes it to a local
    registry container, creates (or reuses) a Kind cluster with an nginx
    ingress controller, and applies all k8s manifests.

    Prerequisites (all must be in PATH):
        kind       https://kind.sigs.k8s.io/docs/user/quick-start/#installation
        kubectl    https://kubernetes.io/docs/tasks/tools/
        podman     https://podman-desktop.io  (Podman Desktop recommended on Windows)

    First run takes ~3-5 minutes (cluster creation + image builds).
    Subsequent runs re-use the cluster and are much faster.

.PARAMETER NoBuild
    Skip Podman build + push; just (re-)apply k8s manifests.

.PARAMETER BuildOnly
    Build and push images only; do not touch the cluster or manifests.

.PARAMETER DeleteCluster
    Tear down the Kind cluster and remove the local registry container.
    DESTROYS ALL MongoDB DATA (PVC). Prompts for confirmation unless -Yes is given.

.PARAMETER Yes
    Skip the confirmation prompt for -DeleteCluster (for automation).

.PARAMETER Forward
    After deploying, open a new PowerShell window that forwards
    localhost:8080 -> backend service (API). On Windows + Podman, WSL2 port
    mapping does not reach the Windows host automatically — this is the
    reliable alternative.

.EXAMPLE
    .\deploy-kind.ps1                  # full build + deploy
    .\deploy-kind.ps1 -NoBuild         # re-apply manifests only
    .\deploy-kind.ps1 -BuildOnly       # images only
    .\deploy-kind.ps1 -DeleteCluster   # tear everything down
    .\deploy-kind.ps1 -NoBuild -Forward   # redeploy + open browser tunnel
#>
[CmdletBinding()]
param(
    [switch]$NoBuild,
    [switch]$BuildOnly,
    [switch]$DeleteCluster,
    [switch]$Forward,
    [switch]$Yes
)

$ErrorActionPreference = "Stop"

# ── configuration ─────────────────────────────────────────────────────────────
$CLUSTER      = "devedu"
$NS           = "devedu"
$REG_NAME     = "kind-registry"
$REG_PORT     = 5000          # host port for the registry (push from host)
$HOST_HTTP    = 8080          # host port mapped to nginx ingress (>1024 avoids Windows admin requirement)
$BACKEND_IMG  = "localhost:${REG_PORT}/devedu/backend:local"
$RUNNER_IMG   = "localhost/devedu/csharp-runner:local"          # in den Sidecar-Store geladen, NICHT in die Registry
$SIDECAR_IMG  = "localhost:${REG_PORT}/devedu/podman-sidecar:local"
$SCRIPT_DIR   = $PSScriptRoot

# Kind reads this env var to choose Podman as the container runtime
$env:KIND_EXPERIMENTAL_PROVIDER = "podman"

# ── helpers ───────────────────────────────────────────────────────────────────
function Write-Step([string]$msg) {
    Write-Host ""
    Write-Host "==> $msg" -ForegroundColor Cyan
}
function Write-Ok([string]$msg)   { Write-Host "    OK  $msg" -ForegroundColor Green  }
function Write-Warn([string]$msg) { Write-Host "    [!] $msg" -ForegroundColor Yellow }
function Fail([string]$msg) {
    Write-Host ""
    Write-Host "[x] $msg" -ForegroundColor Red
    exit 1
}

function Assert-Command([string]$name) {
    if (-not (Get-Command $name -ErrorAction SilentlyContinue)) {
        Fail "'$name' not found in PATH. Please install it first."
    }
}

function Invoke-Kubectl {
    # Passes all positional args through to kubectl and aborts on failure.
    & kubectl $args
    if ($LASTEXITCODE -ne 0) { Fail "kubectl $($args -join ' ') failed (exit $LASTEXITCODE)." }
}

function Invoke-Safe {
    # Runs a native command suppressing PS5.1's NativeCommandError behaviour.
    # Returns captured output (stdout + stderr merged). Sets $LASTEXITCODE normally.
    $prev = $ErrorActionPreference
    $ErrorActionPreference = "SilentlyContinue"
    try   { & $args[0] $args[1..($args.Length - 1)] 2>&1 }
    finally { $ErrorActionPreference = $prev }
}

function Apply-Yaml([string]$yaml) {
    # Writes $yaml to a temp file and applies it via kubectl.
    $tmp = [System.IO.Path]::Combine([System.IO.Path]::GetTempPath(), "$([System.IO.Path]::GetRandomFileName()).yaml")
    try {
        [System.IO.File]::WriteAllText($tmp, $yaml, [System.Text.Encoding]::UTF8)
        Invoke-Kubectl apply -f $tmp
    } finally {
        if (Test-Path $tmp) { Remove-Item $tmp -Force -ErrorAction SilentlyContinue }
    }
}

function Write-TempKindConfig([string]$yaml) {
    $tmp = [System.IO.Path]::Combine([System.IO.Path]::GetTempPath(), "$([System.IO.Path]::GetRandomFileName()).yaml")
    [System.IO.File]::WriteAllText($tmp, $yaml, [System.Text.Encoding]::UTF8)
    return $tmp
}

# ── teardown ──────────────────────────────────────────────────────────────────
if ($DeleteCluster) {
    if (-not $Yes) {
        Write-Host ""
        Write-Host "WARNUNG: 'kind delete cluster --name $CLUSTER' loescht den Node-Container und" -ForegroundColor Yellow
        Write-Host "         damit UNWIDERRUFLICH alle MongoDB-Daten (PVC 'mongo-data')." -ForegroundColor Yellow
        Write-Host "         Importierte Kurse (z.B. '.NET') sind danach weg." -ForegroundColor Yellow
        Write-Host "         Tipp: vorher  .\backup-local.ps1  ausfuehren." -ForegroundColor DarkGray
        Write-Host ""
        $answer = Read-Host "Zum Bestaetigen 'DELETE' eingeben (alles andere bricht ab)"
        if ($answer -ne 'DELETE') {
            Write-Host "Abgebrochen. Es wurde nichts geloescht." -ForegroundColor Green
            exit 0
        }
    }
    Write-Step "Deleting Kind cluster '$CLUSTER'..."
    & kind delete cluster --name $CLUSTER
    Write-Step "Removing registry container '$REG_NAME'..."
    & podman rm -f $REG_NAME 2>&1 | Out-Null
    Write-Ok "Done."
    exit 0
}

# ── prerequisites ─────────────────────────────────────────────────────────────
Write-Step "Checking prerequisites..."
Assert-Command "kind"
Assert-Command "kubectl"
Assert-Command "podman"
Write-Ok "kind, kubectl, podman all found."

# ── local registry ────────────────────────────────────────────────────────────
Write-Step "Ensuring local registry '$REG_NAME' is running..."
$regState   = Invoke-Safe podman inspect --format '{{.State.Running}}' $REG_NAME
$regRunning = ($LASTEXITCODE -eq 0) -and (($regState -join '') -eq 'true')

if (-not $regRunning) {
    & podman rm -f $REG_NAME 2>&1 | Out-Null
    & podman run -d `
        --name $REG_NAME `
        --restart=always `
        -p "${REG_PORT}:5000" `
        registry:2
    if ($LASTEXITCODE -ne 0) { Fail "Failed to start registry container." }
    Write-Ok "Registry started on localhost:$REG_PORT."
} else {
    Write-Ok "Registry already running on localhost:$REG_PORT."
}

# ── kind cluster ──────────────────────────────────────────────────────────────
Write-Step "Ensuring Kind cluster '$CLUSTER' exists..."
$clusterList   = Invoke-Safe kind get clusters
$clusterExists = ($LASTEXITCODE -eq 0) -and (($clusterList -join "`n") -match "(?m)^${CLUSTER}$")

if (-not $clusterExists) {
    Write-Step "Creating Kind cluster '$CLUSTER' (~1-2 minutes)..."

    $kindConfigYaml = @"
kind: Cluster
apiVersion: kind.x-k8s.io/v1alpha4
nodes:
  - role: control-plane
    kubeadmConfigPatches:
      - |
        kind: InitConfiguration
        nodeRegistration:
          kubeletExtraArgs:
            node-labels: "ingress-ready=true"
    extraPortMappings:
      - containerPort: 80
        hostPort: $HOST_HTTP
        protocol: TCP
containerdConfigPatches:
  - |-
    [plugins."io.containerd.grpc.v1.cri".registry]
      [plugins."io.containerd.grpc.v1.cri".registry.mirrors]
        [plugins."io.containerd.grpc.v1.cri".registry.mirrors."localhost:$REG_PORT"]
          endpoint = ["http://${REG_NAME}:5000"]
"@

    $tmpCfg = Write-TempKindConfig $kindConfigYaml
    try {
        & kind create cluster --name $CLUSTER --config $tmpCfg
        if ($LASTEXITCODE -ne 0) { Fail "Kind cluster creation failed." }
    } finally {
        Remove-Item $tmpCfg -Force -ErrorAction SilentlyContinue
    }

    Write-Ok "Cluster '$CLUSTER' created."
} else {
    Write-Ok "Cluster '$CLUSTER' already exists."
}

# Make sure kubectl talks to this cluster
& kubectl config use-context "kind-$CLUSTER" | Out-Null
if ($LASTEXITCODE -ne 0) { Fail "Could not switch kubectl context to 'kind-$CLUSTER'." }

# ── connect registry to Kind network ─────────────────────────────────────────
# The cluster nodes resolve 'kind-registry' via Podman's internal DNS on the
# 'kind' network, so the containerd mirror (http://kind-registry:5000) works.
Write-Step "Connecting registry to 'kind' Podman network..."
$netJson   = Invoke-Safe podman inspect --format '{{json .NetworkSettings.Networks}}' $REG_NAME
$onKindNet = (($netJson -join '') -match '"kind"')

if (-not $onKindNet) {
    & podman network connect kind $REG_NAME 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) {
        Write-Warn "Could not connect '$REG_NAME' to 'kind' network (may need manual: podman network connect kind $REG_NAME)."
    } else {
        Write-Ok "Registry connected to 'kind' network."
    }
} else {
    Write-Ok "Registry already on 'kind' network."
}

# ── nginx ingress controller ──────────────────────────────────────────────────
Write-Step "Checking nginx ingress controller..."
$ingressNs      = Invoke-Safe kubectl get ns ingress-nginx --ignore-not-found --no-headers
$ingressPresent = ($LASTEXITCODE -eq 0) -and (-not [string]::IsNullOrWhiteSpace(($ingressNs -join '')))

if (-not $ingressPresent) {
    Write-Step "Installing nginx ingress controller (requires internet access)..."
    $NGINX_URL = "https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/kind/deploy.yaml"
    & kubectl apply -f $NGINX_URL
    if ($LASTEXITCODE -ne 0) { Fail "nginx ingress controller installation failed." }

    Write-Step "Waiting for ingress controller to become ready (up to 120 s)..."
    & kubectl wait --namespace ingress-nginx `
        --for=condition=ready pod `
        --selector=app.kubernetes.io/component=controller `
        --timeout=120s
    if ($LASTEXITCODE -ne 0) { Fail "Ingress controller pod did not become ready in time." }
    Write-Ok "Ingress controller ready."
} else {
    Write-Ok "Ingress controller already installed."
}

# ── build + push images ───────────────────────────────────────────────────────
if (-not $NoBuild) {
    Write-Step "Building backend image..."
    & podman build -t $BACKEND_IMG "$SCRIPT_DIR\backend"
    if ($LASTEXITCODE -ne 0) { Fail "Backend image build failed." }

    Write-Step "Pushing image to localhost:$REG_PORT..."
    & podman push --tls-verify=false $BACKEND_IMG
    if ($LASTEXITCODE -ne 0) { Fail "Backend image push failed." }
    Write-Ok "Image pushed."

    # ── F7: Sandbox-Runner + Podman-Sidecar ──────────────────────────────────
    # Der Runner wird NICHT in die Registry gepusht; er wird als Tarball in den
    # (getrennten) Image-Store des Sidecars geladen. Der Sidecar trägt den Tarball.
    Write-Step "Building C# sandbox runner image..."
    & podman build -t $RUNNER_IMG "$SCRIPT_DIR\sandbox\csharp-runner"
    if ($LASTEXITCODE -ne 0) { Fail "Runner image build failed." }

    Write-Step "Exporting runner image into the sidecar build context..."
    & podman save -o "$SCRIPT_DIR\sandbox\podman-sidecar\csharp-runner.tar" $RUNNER_IMG
    if ($LASTEXITCODE -ne 0) { Fail "podman save (runner) failed." }

    Write-Step "Building Podman sidecar image..."
    & podman build -t $SIDECAR_IMG "$SCRIPT_DIR\sandbox\podman-sidecar"
    if ($LASTEXITCODE -ne 0) { Fail "Sidecar image build failed." }

    Write-Step "Pushing sidecar image to localhost:$REG_PORT..."
    & podman push --tls-verify=false $SIDECAR_IMG
    if ($LASTEXITCODE -ne 0) { Fail "Sidecar image push failed." }
    Write-Ok "Sandbox images built and pushed."
}

if ($BuildOnly) {
    Write-Ok "Build-only mode. Done."
    exit 0
}

# ── apply k8s manifests ───────────────────────────────────────────────────────
Write-Step "Applying k8s manifests..."
Invoke-Kubectl apply -f "$SCRIPT_DIR\k8s\00-namespace.yaml"

# 10-mongo.yaml uses storageClassName: local-path (k3s-specific).
# Kind ships with 'standard' — patch the PVC inline, keep the Deployment + Service from file.
Apply-Yaml @"
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: mongo-data
  namespace: $NS
spec:
  accessModes: ["ReadWriteOnce"]
  storageClassName: standard
  resources:
    requests:
      storage: 1Gi
"@
# Apply only the Deployment and Service from 10-mongo.yaml (skip the PVC already applied above)
$mongoYaml = Get-Content "$SCRIPT_DIR\k8s\10-mongo.yaml" -Raw
$mongoParts = $mongoYaml -split '(?m)^---\s*$'
# Parts: [0] PVC (skip), [1] Deployment, [2] Service
foreach ($part in $mongoParts[1..($mongoParts.Length - 1)]) {
    if ($part.Trim() -ne '') { Apply-Yaml $part }
}

Invoke-Kubectl apply -f "$SCRIPT_DIR\k8s\20-backend.yaml"

# 40-ingress.yaml uses ingressClassName: traefik (k3s-specific).
# We apply an equivalent manifest with ingressClassName: nginx instead.
Apply-Yaml @"
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: devedu
  namespace: $NS
  labels:
    app: devedu
spec:
  ingressClassName: nginx
  rules:
    - host: devedu.localhost
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: backend
                port:
                  number: 8080
"@

Write-Ok "All manifests applied."

# Force a rollout so pods pick up freshly pushed images (imagePullPolicy: Always)
Write-Step "Triggering rolling restart..."
& kubectl -n $NS rollout restart deployment/backend 2>&1 | Out-Null

# ── wait for rollouts ─────────────────────────────────────────────────────────
Write-Step "Waiting for rollouts to complete (180 s each)..."
foreach ($dep in @("mongo", "backend")) {
    Write-Host "    deployment/$dep ..." -ForegroundColor Gray
    & kubectl -n $NS rollout status "deployment/$dep" --timeout=180s
    if ($LASTEXITCODE -ne 0) {
        Write-Warn "Rollout of '$dep' timed out. Check logs: kubectl -n $NS logs deploy/$dep"
    }
}

Write-Step "Pod overview:"
& kubectl -n $NS get pods -o wide

# ── port-forward (Podman/WSL2 workaround) ────────────────────────────────────
# On Windows + Podman, Kind's extraPortMappings only bind inside the WSL2 VM.
# kubectl port-forward tunnels directly through the kube-apiserver and works
# without admin rights or hosts-file changes.
$FWD_PORT = 8080

if ($Forward) {
    Write-Step "Starting port-forward: localhost:$FWD_PORT -> backend:8080 ..."
    $fwdArgs = "-NoExit -Command `"kubectl -n $NS port-forward svc/backend ${FWD_PORT}:8080`""
    Start-Process powershell -ArgumentList $fwdArgs
    Write-Ok "Port-forward running in a new window. Verify: http://localhost:${FWD_PORT}/health"
}

# ── done ──────────────────────────────────────────────────────────────────────
Write-Host @"

Deployed.

  On Windows + Podman, WSL2 does not forward Kind ports to localhost.
  Use port-forward to access the API (no admin needed):

      kubectl -n devedu port-forward svc/backend 8080:8080

  port-forward tunnels straight to the backend Service (the ingress/host
  'devedu.localhost' is bypassed), so the host is plain 'localhost':

      Reachability check : http://localhost:8080/health   -> {"status":"ok"}
      API base URL       : http://localhost:8080           (endpoints under /api/...)
      e.g.                 http://localhost:8080/api/courses

  Note: there is no route at bare '/api' on older builds — it now returns a
  200 info payload, but only after you rebuild the image (run WITHOUT -NoBuild).

  Or run this script with -Forward to open the tunnel automatically:
      .\deploy-kind.ps1 -NoBuild -Forward

  Web UI: run the Expo app with 'npx expo start --web' (mobile/ directory).

Auth (Clerk):
    Register in-app (email + password, email-code verification).
    Roles live in Clerk public_metadata.role: 'instructor' (Author) / 'admin'; unset = Learner.
    Assign: clerk api /users/<id>/metadata -X PATCH -d '{"public_metadata":{"role":"instructor"}}'
    (under Git Bash prefix MSYS_NO_PATHCONV=1). Re-login after a role change.
    See README -> "Auth & Rollen (Clerk)".

Useful commands:
    kubectl -n devedu get pods
    kubectl -n devedu logs deploy/backend
    kubectl -n devedu logs deploy/mongo
    .\deploy-kind.ps1 -NoBuild         # re-apply manifests, skip build
    .\deploy-kind.ps1 -BuildOnly       # build images only
    .\deploy-kind.ps1 -DeleteCluster   # tear down cluster + registry
"@ -ForegroundColor Green
