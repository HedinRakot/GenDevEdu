<#
.SYNOPSIS
    Spielt den versionierten Inhalts-Overlay (course-content/dotnet/) idempotent in
    die LOKALE devedu-DB (Kind-Cluster) ein: ergaenzt/fixt DE/EN-Uebersetzungen und
    fuegt neu verfasste Kapitel-Inhalte hinzu.

.DESCRIPTION
    Hintergrund: Der aus der Prod-Quelle importierte ".NET"-Kurs ist unvollstaendig
    (mehrere Kapitel nur Russisch, eine leere Ueberschrift, hintere Kapitel ohne
    Inhalt). Die fehlenden DE/EN-Texte existieren in KEINER Quelle und werden daher
    hier aus dem Repo nachgepflegt.

    Mechanik (analog import-course.ps1, aber REIN LOKAL - kein Prod-Connection-String):
      - node build-overlay-js.cjs liest manifest.json + die Markdown-Body-Dateien und
        erzeugt EIN mongosh-Skript mit eingebettetem Overlay (Node statt PS, weil
        PowerShell-5.1-ConvertTo-Json fuer diese Datenmenge zu langsam ist)
      - das Skript wird base64-kodiert in 16k-Bloecken in den mongo-Pod geschoben
        (umgeht Windows-Cmdlimit + PS-5.1-Quoting), einmal dekodiert und via mongosh
        gegen die lokale DB (localhost:27017) ausgefuehrt
      - gematcht wird per _id (Chapters._id / ChapterContent._id); eingebettete IDs
        werden korrekt als _id geschrieben (nicht Id) -> sonst stille Lookup-Fehler

    Idempotent: setzt Titel/Texte je Sprache deterministisch (upsert je Language-Item),
    neue Inhalte werden per _id ge-upsertet (kein Duplikat bei Mehrfachlauf).

.PARAMETER ContentDir
    Verzeichnis mit manifest.json + Body-Dateien. Default: <Skriptpfad>/course-content/dotnet

.PARAMETER TargetDb
    Lokale Ziel-DB. Default: devedu

.PARAMETER Namespace
    Kubernetes-Namespace des mongo-Pods. Default: devedu

.PARAMETER DryRun
    Nur lesen + Zaehlung anzeigen, nichts schreiben.
#>
[CmdletBinding()]
param(
    [string]$ContentDir = (Join-Path $PSScriptRoot "course-content\dotnet"),
    [string]$TargetDb = "devedu",
    [string]$Namespace = "devedu",
    [switch]$DryRun
)

$ErrorActionPreference = "Stop"

$manifestPath = Join-Path $ContentDir "manifest.json"
$builder = Join-Path $ContentDir "build-overlay-js.cjs"
if (-not (Test-Path $manifestPath)) { throw "manifest.json nicht gefunden: $manifestPath" }
if (-not (Test-Path $builder)) { throw "build-overlay-js.cjs nicht gefunden: $builder" }

# ── mongosh-Skript via Node bauen (manifest + Body-Dateien -> /tmp/*.js) ──────────
Write-Host "Baue Overlay-Skript (node build-overlay-js.cjs) ..." -ForegroundColor Cyan
$jsPath = Join-Path $env:TEMP ("devedu-apply-{0}.js" -f ([guid]::NewGuid().ToString("N")))
$dryArg = if ($DryRun) { "true" } else { "false" }
& node $builder $ContentDir $TargetDb $dryArg $jsPath
if ($LASTEXITCODE -ne 0) { throw "node build-overlay-js.cjs fehlgeschlagen (Exit $LASTEXITCODE)." }
if (-not (Test-Path $jsPath)) { throw "Erwartetes Skript wurde nicht erzeugt: $jsPath" }

try {
    Write-Host "Suche Mongo-Pod im Namespace '$Namespace' ..." -ForegroundColor Cyan
    $pod = (kubectl get pods -n $Namespace -l app=mongo -o jsonpath="{.items[0].metadata.name}")
    if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($pod)) {
        throw "Kein Mongo-Pod gefunden. (kubectl get pods -n $Namespace)"
    }
    Write-Host "  Pod: $pod" -ForegroundColor DarkGray

    # ── base64-kodiert in 16k-Bloecken in den Pod schieben + einmal dekodieren ────
    $b64 = [Convert]::ToBase64String([IO.File]::ReadAllBytes($jsPath))
    Write-Host ("Uebertrage Skript ({0:N0} Zeichen base64) in den Pod ..." -f $b64.Length) -ForegroundColor DarkGray
    kubectl exec -n $Namespace $pod -- sh -c "rm -f /tmp/devedu-apply.b64 /tmp/devedu-apply.js" | Out-Null
    if ($LASTEXITCODE -ne 0) { throw "Konnte Pod-Tempdateien nicht vorbereiten." }
    $chunkSize = 16000
    for ($i = 0; $i -lt $b64.Length; $i += $chunkSize) {
        $chunk = $b64.Substring($i, [Math]::Min($chunkSize, $b64.Length - $i))
        kubectl exec -n $Namespace $pod -- sh -c "printf '%s' '$chunk' >> /tmp/devedu-apply.b64" | Out-Null
        if ($LASTEXITCODE -ne 0) { throw "Block-Transfer fehlgeschlagen bei Offset $i." }
    }
    kubectl exec -n $Namespace $pod -- sh -c "base64 -d /tmp/devedu-apply.b64 > /tmp/devedu-apply.js" | Out-Null
    if ($LASTEXITCODE -ne 0) { throw "base64-Dekodierung im Pod fehlgeschlagen." }

    if ($DryRun) { Write-Host "Starte DRY-RUN (nur lesen) ..." -ForegroundColor Yellow }
    else { Write-Host "Wende Overlay auf lokale DB an ..." -ForegroundColor Green }

    try {
        kubectl exec -n $Namespace $pod -- mongosh --quiet --file /tmp/devedu-apply.js
        $code = $LASTEXITCODE
    } finally {
        kubectl exec -n $Namespace $pod -- rm -f /tmp/devedu-apply.b64 /tmp/devedu-apply.js | Out-Null
    }
    if ($code -ne 0) { throw "mongosh endete mit Exit-Code $code." }
} finally {
    Remove-Item -Force -ErrorAction SilentlyContinue $jsPath
}

Write-Host ""
Write-Host "Erledigt." -ForegroundColor Green
