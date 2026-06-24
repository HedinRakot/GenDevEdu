#!/usr/bin/env bash
#
# deploy.sh — build, push and deploy DevEdu (MVP) to the local k3s cluster.
#
# Steps: build backend + frontend images -> push to localhost:5000 -> apply k8s
# manifests -> wait for rollouts. Uses `sudo k3s kubectl` (kubeconfig is root-only).
#
# Flags:
#   --no-build     skip docker build/push (just re-apply manifests)
#   --build-only   build + push images, do not touch the cluster
#
set -euo pipefail
cd "$(dirname "$0")"

REGISTRY="localhost:5000"
BACKEND_IMAGE="${REGISTRY}/devedu/backend:local"
FRONTEND_IMAGE="${REGISTRY}/devedu/frontend:local"
NS="devedu"

DO_BUILD=1
DO_DEPLOY=1
for arg in "$@"; do
  case "$arg" in
    --no-build)   DO_BUILD=0 ;;
    --build-only) DO_DEPLOY=0 ;;
    *) echo "Unknown flag: $arg" >&2; exit 2 ;;
  esac
done

note() { printf '\033[1;34m==>\033[0m %s\n' "$*"; }
die()  { printf '\033[1;31m[x]\033[0m %s\n' "$*" >&2; exit 1; }

# --- preflight ---------------------------------------------------------------
command -v docker >/dev/null || die "docker not found."
if [ "$DO_BUILD" -eq 1 ]; then
  if ! curl -sf "http://${REGISTRY}/v2/" >/dev/null 2>&1; then
    die "Local registry ${REGISTRY} is not reachable. Run ./setup-registry.sh first."
  fi
fi

# --- build + push ------------------------------------------------------------
if [ "$DO_BUILD" -eq 1 ]; then
  note "Building backend image: $BACKEND_IMAGE"
  docker build -t "$BACKEND_IMAGE" ./backend
  note "Building frontend image: $FRONTEND_IMAGE"
  docker build -t "$FRONTEND_IMAGE" ./frontend
  note "Pushing images to $REGISTRY"
  docker push "$BACKEND_IMAGE"
  docker push "$FRONTEND_IMAGE"
fi

[ "$DO_DEPLOY" -eq 0 ] && { note "Build-only mode; done."; exit 0; }

# --- deploy ------------------------------------------------------------------
note "Applying k8s manifests (sudo)."
sudo k3s kubectl apply -f k8s/

# Force a fresh pull of the :local tag even if the deployment spec is unchanged.
note "Restarting deployments to pull the latest images."
sudo k3s kubectl -n "$NS" rollout restart deployment/backend deployment/frontend || true

note "Waiting for rollouts..."
sudo k3s kubectl -n "$NS" rollout status deployment/mongo    --timeout=180s
sudo k3s kubectl -n "$NS" rollout status deployment/backend  --timeout=180s
sudo k3s kubectl -n "$NS" rollout status deployment/frontend --timeout=180s

note "Pods:"
sudo k3s kubectl -n "$NS" get pods -o wide

cat <<EOF

✅ Deployed. Open: http://devedu.localhost

If the hostname does not resolve, add this line to /etc/hosts:
    127.0.0.1   devedu.localhost

Seed logins:  author@devedu.local / Passw0rd!   (Author)
              learner@devedu.local / Passw0rd!  (Learner)

Run E2E tests:  ./test-e2e.sh
EOF
