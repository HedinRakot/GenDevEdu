<#
.SYNOPSIS
    Sichert die lokale DevEdu-MongoDB (im Kind-Cluster) als komprimiertes Archiv
    auf deine Maschine. Read-only, veraendert nichts im Cluster.

.DESCRIPTION
    Fuehrt mongodump IM Mongo-Pod aus (gzip-Archiv in /tmp), holt das Archiv per
    base64 heraus und legt es unter .\backups\ ab. Unabhaengig von Cluster und
    Prod-Quelle: selbst nach 'kind delete cluster' kannst du daraus wiederherstellen
    (siehe restore-local.ps1).

.PARAMETER TargetDb
    Zu sichernde Datenbank. Default: devedu

.PARAMETER OutDir
    Zielordner fuer das Backup. Default: .\backups (relativ zum Skript)

.PARAMETER Namespace
    Kubernetes-Namespace des Mongo-Pods. Default: devedu

.EXAMPLE
    .\backup-local.ps1
#>
[CmdletBinding()]
param(
    [string]$TargetDb = "devedu",
    [string]$OutDir = (Join-Path $PSScriptRoot "backups"),
    [string]$Namespace = "devedu"
)

$ErrorActionPreference = "Stop"

Write-Host "Suche Mongo-Pod im Namespace '$Namespace' ..." -ForegroundColor Cyan
$pod = (kubectl get pods -n $Namespace -l app=mongo -o jsonpath="{.items[0].metadata.name}")
if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($pod)) {
    throw "Kein Mongo-Pod gefunden. (kubectl get pods -n $Namespace)"
}
Write-Host "  Pod: $pod" -ForegroundColor DarkGray

if (-not (Test-Path $OutDir)) { New-Item -ItemType Directory -Path $OutDir -Force | Out-Null }
$stamp   = Get-Date -Format "yyyyMMdd-HHmmss"
$outFile = Join-Path $OutDir "$TargetDb-$stamp.archive.gz"
$remote  = "/tmp/devedu-backup.archive.gz"

Write-Host "Erzeuge Dump im Pod (mongodump, gzip) ..." -ForegroundColor Yellow
kubectl exec -n $Namespace $pod -- mongodump --host localhost --port 27017 --db $TargetDb --archive=$remote --gzip
if ($LASTEXITCODE -ne 0) { throw "mongodump fehlgeschlagen." }

Write-Host "Hole Archiv aus dem Pod ..." -ForegroundColor Yellow
$b64 = (kubectl exec -n $Namespace $pod -- base64 -w0 $remote) -join ''
kubectl exec -n $Namespace $pod -- rm -f $remote | Out-Null
if ([string]::IsNullOrWhiteSpace($b64)) { throw "Konnte den Dump nicht auslesen." }

[IO.File]::WriteAllBytes($outFile, [Convert]::FromBase64String($b64))
$kb = [math]::Round((Get-Item $outFile).Length / 1KB, 1)

Write-Host ""
Write-Host "Backup gespeichert:" -ForegroundColor Green
Write-Host "  $outFile  ($kb KB)"
Write-Host "Wiederherstellen mit:  .\restore-local.ps1 -ArchivePath `"$outFile`""
