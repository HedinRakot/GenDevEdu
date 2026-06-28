<#
.SYNOPSIS
    Inventarisiert eine Remote-/Prod-MongoDB NUR LESEND. Findet selbst heraus, in
    welcher Datenbank Kurse liegen, und zeigt Collections + Verknuepfungen.

.DESCRIPTION
    Schreibt nichts. Laeuft via mongosh im Mongo-Pod des Kind-Clusters.
    mongosh verbindet sich PRIMAER mit der Quelle (so funktionieren auch
    mongodb+srv-URIs). Der Connection-String wird nur INNERHALB des Pods aus einer
    Datei gelesen (per cat), taucht also nicht in Befehls-Argumenten/History auf.

.PARAMETER SourceUriFile
    Pfad zu einer lokalen Textdatei, die NUR den Connection-String enthaelt.

.PARAMETER Namespace
    Kubernetes-Namespace des Mongo-Pods. Default: devedu
#>
[CmdletBinding()]
param(
    [string]$SourceUriFile = "C:\Users\larsl\AppData\Local\Temp\claude\C--Users-larsl-ssd-data-Developer-GenDevEdu-Feature\9d7c3596-9bed-4044-8428-433efc428cbc\scratchpad\source-uri.txt",
    [string]$Namespace = "devedu"
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path $SourceUriFile)) {
    throw "Connection-String-Datei nicht gefunden: $SourceUriFile"
}
# Inhalt lesen und evtl. umschliessende Quotes/Whitespace entfernen.
$SourceUri = (Get-Content -Raw $SourceUriFile).Trim().Trim('"').Trim("'").Trim()
if ([string]::IsNullOrWhiteSpace($SourceUri)) { throw "Die Datei $SourceUriFile ist leer." }

Write-Host "Suche Mongo-Pod im Namespace '$Namespace' ..." -ForegroundColor Cyan
$pod = (kubectl get pods -n $Namespace -l app=mongo -o jsonpath="{.items[0].metadata.name}")
if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($pod)) {
    throw "Kein Mongo-Pod gefunden. (kubectl get pods -n $Namespace)"
}
Write-Host "  Pod: $pod" -ForegroundColor DarkGray

# Read-only Inventarisierungs-Skript (mongosh ist mit der Quelle verbunden -> db = Quelle)
$js = @'
const conn = db.getMongo();

function inspectDb(name) {
  const d = conn.getDB(name);
  print("");
  print("=== DB: " + name + " ===");
  let cols = [];
  try { cols = d.getCollectionNames().sort(); } catch (e) { print("   (keine Leserechte)"); return []; }
  cols.forEach(function (c) {
    let n = -1;
    try { n = d.getCollection(c).countDocuments({}); } catch (e) { n = -1; }
    print("   " + (c + "                              ").slice(0, 30) + " " + n);
  });
  return cols;
}

let dbNames = [];
try {
  dbNames = conn.getDBNames().filter(function (n) { return ["admin", "local", "config"].indexOf(n) === -1; });
  print("Gefundene Datenbanken: " + dbNames.join(", "));
} catch (e) {
  dbNames = [db.getName()];
  print("(Keine DB-Liste moeglich - betrachte nur aktuelle DB: " + db.getName() + ")");
}

dbNames.forEach(function (name) {
  const cols = inspectDb(name);
  if (cols.indexOf("courses") === -1) return;

  const fdb = conn.getDB(name);
  const courses = fdb.courses.find({}, { Name: 1, Status: 1, Chapters: 1 }).toArray();
  print("   --> 'courses' gefunden: " + courses.length + " Kurs(e)");
  const courseIds = [];
  courses.forEach(function (c) {
    courseIds.push(c._id);
    const chapters = (c.Chapters && c.Chapters.length) || 0;
    let qlc = 0;
    try { qlc = fdb.questionlists.countDocuments({ CourseId: c._id }); } catch (e) {}
    print("       - _id=" + c._id +
          " | " + ((c.Name || "(ohne Name)") + "                         ").slice(0, 28) +
          " | Status=" + (c.Status || "?") +
          " | Kapitel=" + chapters +
          " | questionlists=" + qlc);
  });

  if (cols.indexOf("questionlists") !== -1) {
    const total = fdb.questionlists.countDocuments({});
    let orphan = -1;
    try { orphan = fdb.questionlists.countDocuments({ CourseId: { $nin: courseIds } }); } catch (e) {}
    print("       questionlists gesamt: " + total + " | verwaist (kein passender Kurs): " + orphan);
  }
});

print("");
print("FERTIG.");
'@

$remoteJs  = "/tmp/devedu-inspect.js"
$remoteUri = "/tmp/devedu-src-uri"
$remoteRun = "/tmp/devedu-run.sh"

# Wrapper-Shellskript: liest die URI im Pod aus der Datei (nicht in Argumenten sichtbar).
$runSh = "mongosh --quiet `"`$(cat $remoteUri)`" $remoteJs"

$b64js  = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($js))
$b64uri = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($SourceUri))
$b64run = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($runSh))

# Alles base64-codiert ablegen -> keine Quotes/Spaces in kubectl-Argumenten.
kubectl exec -n $Namespace $pod -- bash -c "echo $b64js | base64 -d > $remoteJs; echo $b64uri | base64 -d > $remoteUri; echo $b64run | base64 -d > $remoteRun"
if ($LASTEXITCODE -ne 0) { throw "Konnte Skript/URI nicht in den Pod schreiben." }

Write-Host "Inspiziere Quelle (nur lesend) ..." -ForegroundColor Yellow
try {
    kubectl exec -n $Namespace $pod -- bash $remoteRun
    $code = $LASTEXITCODE
} finally {
    kubectl exec -n $Namespace $pod -- rm -f $remoteJs $remoteUri $remoteRun | Out-Null
}

if ($code -ne 0) {
    throw "mongosh endete mit Exit-Code $code. (Tipp bei Atlas: oeffentliche IP dieser Maschine ggf. in Atlas > Network Access freigeben.)"
}
