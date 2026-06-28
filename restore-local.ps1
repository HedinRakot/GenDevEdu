<#
.SYNOPSIS
    Stellt die lokale DevEdu-MongoDB aus einem Backup-Archiv (backup-local.ps1)
    wieder her.

.DESCRIPTION
    Ueberspielt das Archiv per base64 in den Mongo-Pod und fuehrt dort mongorestore
    mit --drop aus: die im Archiv enthaltenen Collections werden vorher geleert und
    neu eingespielt. Collections, die NICHT im Archiv sind, bleiben unangetastet.

.PARAMETER ArchivePath
    Pfad zum *.archive.gz. Ohne Angabe wird das neueste Backup in -BackupDir genommen.

.PARAMETER TargetDb
    Ziel-Datenbank. Default: devedu

.PARAMETER BackupDir
    Ordner, in dem nach dem neuesten Backup gesucht wird. Default: .\backups

.PARAMETER Namespace
    Kubernetes-Namespace des Mongo-Pods. Default: devedu

.PARAMETER Yes
    Sicherheitsabfrage ueberspringen (fuer Automatisierung).

.EXAMPLE
    .\restore-local.ps1                                  # neuestes Backup
    .\restore-local.ps1 -ArchivePath .\backups\devedu-20260627-202447.archive.gz
#>
[CmdletBinding()]
param(
    [string]$ArchivePath,
    [string]$TargetDb = "devedu",
    [string]$BackupDir = (Join-Path $PSScriptRoot "backups"),
    [string]$Namespace = "devedu",
    [switch]$Yes
)

$ErrorActionPreference = "Stop"

# Neuestes Backup waehlen, falls kein Pfad angegeben.
if ([string]::IsNullOrWhiteSpace($ArchivePath)) {
    $latest = Get-ChildItem -Path $BackupDir -Filter "*.archive.gz" -ErrorAction SilentlyContinue |
              Sort-Object LastWriteTime -Descending | Select-Object -First 1
    if (-not $latest) { throw "Kein Backup in '$BackupDir' gefunden. Gib -ArchivePath an." }
    $ArchivePath = $latest.FullName
}
if (-not (Test-Path $ArchivePath)) { throw "Archiv nicht gefunden: $ArchivePath" }

# Sicherheitsabfrage (Restore ueberschreibt die aktuelle lokale DB).
if (-not $Yes) {
    Write-Host ""
    Write-Host "Restore ueberschreibt die lokale DB '$TargetDb' (--drop der enthaltenen Collections)." -ForegroundColor Yellow
    Write-Host "  Quelle: $ArchivePath" -ForegroundColor DarkGray
    $a = Read-Host "Fortfahren? (j/N)"
    if ($a -ne 'j' -and $a -ne 'J') { Write-Host "Abgebrochen. Es wurde nichts geaendert." -ForegroundColor Green; exit 0 }
}

Write-Host "Suche Mongo-Pod im Namespace '$Namespace' ..." -ForegroundColor Cyan
$pod = (kubectl get pods -n $Namespace -l app=mongo -o jsonpath="{.items[0].metadata.name}")
if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($pod)) {
    throw "Kein Mongo-Pod gefunden. (kubectl get pods -n $Namespace)"
}
Write-Host "  Pod: $pod" -ForegroundColor DarkGray

$remote    = "/tmp/devedu-restore.archive.gz"
$remoteB64 = "/tmp/devedu-restore.b64"
$b64 = [Convert]::ToBase64String([IO.File]::ReadAllBytes($ArchivePath))

# Archiv in Bloecken als base64-Text in den Pod schreiben (umgeht Stdin-Encoding und
# das Windows-Kommandozeilenlimit), danach einmalig dekodieren.
Write-Host "Uebertrage Archiv in den Pod ($([math]::Round($b64.Length/1KB)) KB base64) ..." -ForegroundColor Yellow
kubectl exec -n $Namespace $pod -- bash -c "rm -f $remoteB64" | Out-Null
$chunkSize = 16000
for ($i = 0; $i -lt $b64.Length; $i += $chunkSize) {
    $chunk = $b64.Substring($i, [Math]::Min($chunkSize, $b64.Length - $i))
    # base64-Alphabet enthaelt keine Single-Quotes/Shell-Sonderzeichen -> sicheres Quoting.
    kubectl exec -n $Namespace $pod -- bash -c "printf '%s' '$chunk' >> $remoteB64"
    if ($LASTEXITCODE -ne 0) { throw "Konnte das Archiv nicht in den Pod schreiben (Block bei $i)." }
}

Write-Host "Spiele Backup ein (mongorestore --drop) ..." -ForegroundColor Yellow
try {
    kubectl exec -n $Namespace $pod -- bash -c "base64 -d $remoteB64 > $remote"
    if ($LASTEXITCODE -ne 0) { throw "base64-Dekodierung im Pod fehlgeschlagen." }
    kubectl exec -n $Namespace $pod -- mongorestore --host localhost --port 27017 --archive=$remote --gzip --drop
    $code = $LASTEXITCODE
} finally {
    kubectl exec -n $Namespace $pod -- rm -f $remote $remoteB64 | Out-Null
}
if ($code -ne 0) { throw "mongorestore fehlgeschlagen (Exit $code)." }

Write-Host ""
Write-Host "Restore abgeschlossen aus:" -ForegroundColor Green
Write-Host "  $ArchivePath"
