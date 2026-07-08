<#
.SYNOPSIS
    Teilt den eingebetteten ".NET"-Kurs der lokalen DevEdu-MongoDB (Kind-Cluster)
    in ZWEI separate Kurse auf:

      .NET Grundlagen (Kapitel 1-6)   -> Kapitel-Indizes 0..6 (inkl. Setup-Kapitel)
      .NET Aufbau     (Kapitel 7-12)  -> Kapitel-Indizes 7..12

.DESCRIPTION
    Der Quellkurs hat 13 eingebettete Kapitel: die nummerierten 1-12 plus ein
    unnummeriertes "Programmierumgebung einrichten" (VS-Install), das zwischen
    Kapitel 2 und 3 liegt. Dieses Setup-Kapitel wandert nach Teil 1 (Anfang).

    Vorgehen (mongosh IM Mongo-Pod, Ziel = localhost):
      1. Original ".NET" laden (per Name, aber nicht die Teil-Kurse).
      2. Kapitel nach SortOrder sortieren, in 0..6 / 7.. splitten.
      3. Zwei neue Kurs-Dokumente mit festen _ids anlegen (idempotent, ersetzt
         vorhandene Teil-Kurse). Kapitel/Content-_ids bleiben unveraendert;
         CourseId in Chapters/Contents wird auf die neue Kurs-_id gesetzt,
         SortOrder je Teil neu ab 0 vergeben.
      4. Die zugehoerigen questionlists (per ChapterContentId -> Kapitel -> Teil)
         auf die neue CourseId umhaengen.
      5. Original-".NET"-Kurs loeschen (Ersetzen-Modus).

    Idempotent: laesst sich nach einem Re-Import (import-course.ps1 stellt den
    einzelnen ".NET"-Kurs wieder her) erneut ausfuehren. Ist bereits gesplittet
    (kein Original mehr vorhanden), passiert nichts.

    Hinweis: Alte enrollments/progress/attempts, die auf die alte Kurs-_id
    zeigen, verwaisen dadurch (lokale Dev-Daten; per restore-local.ps1 aus dem
    Backup wiederherstellbar).

.PARAMETER TargetDb
    Ziel-Datenbank. Default: devedu

.PARAMETER Namespace
    Kubernetes-Namespace des Mongo-Pods. Default: devedu

.PARAMETER DryRun
    Nur lesen + Zaehlung anzeigen, nichts schreiben.

.EXAMPLE
    .\split-dotnet-course.ps1 -DryRun
    .\split-dotnet-course.ps1
#>
[CmdletBinding()]
param(
    [string]$TargetDb = "devedu",
    [string]$Namespace = "devedu",
    [switch]$DryRun
)

$ErrorActionPreference = "Stop"

Write-Host "Suche Mongo-Pod im Namespace '$Namespace' ..." -ForegroundColor Cyan
$pod = (kubectl get pods -n $Namespace -l app=mongo -o jsonpath="{.items[0].metadata.name}")
if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($pod)) {
    throw "Kein Mongo-Pod gefunden. (kubectl get pods -n $Namespace)"
}
Write-Host "  Pod: $pod" -ForegroundColor DarkGray

$js = @'
const d = db.getSiblingDB(__TGT_DB__);
const DRYRUN = __DRYRUN__;

// Feste _ids der beiden Teil-Kurse (24-Hex, stabil => idempotent).
const P1 = "63f93699b75850532d660001";  // .NET Grundlagen (Kapitel 1-6)
const P2 = "63f93699b75850532d660002";  // .NET Aufbau     (Kapitel 7-12)
const SPLIT_AFTER_INDEX = 6;            // 0..6 -> P1, 7.. -> P2

// Original laden (die Teil-Kurse ausdruecklich ausschliessen).
const src = d.courses.findOne({ Name: ".NET", _id: { $nin: [P1, P2] } });
if (!src) { print("Kein Original-'.NET'-Kurs gefunden - evtl. bereits gesplittet. Nichts zu tun."); quit(0); }

const origId = String(src._id);
const chapters = (src.Chapters || []).slice()
  .sort(function (a, b) { return (a.SortOrder || 0) - (b.SortOrder || 0); });
const part1 = chapters.slice(0, SPLIT_AFTER_INDEX + 1);
const part2 = chapters.slice(SPLIT_AFTER_INDEX + 1);

// ChapterContent-_id -> Teil-Kurs-_id (fuer die questionlists).
const contentToPart = {};
part1.forEach(function (ch) { (ch.ChapterContent || []).forEach(function (cc) { contentToPart[String(cc._id)] = P1; }); });
part2.forEach(function (ch) { (ch.ChapterContent || []).forEach(function (cc) { contentToPart[String(cc._id)] = P2; }); });

function retarget(chs, newId) {
  return chs.map(function (ch, i) {
    const c = Object.assign({}, ch);
    c.CourseId = newId;
    c.SortOrder = i * 10;
    c.ChapterContent = (ch.ChapterContent || []).map(function (cc) {
      return Object.assign({}, cc, { CourseId: newId });
    });
    return c;
  });
}

const now = new Date();
function courseDoc(id, name, de, en, ru, chs) {
  return {
    _id: id, ElementId: id, Name: name,
    Titel: { Items: [ { Text: ru, Language: 0 }, { Text: de, Language: 1 }, { Text: en, Language: 2 } ] },
    AuthorId: src.AuthorId || "import",
    Status: "Published",
    Chapters: retarget(chs, id),
    Tags: src.Tags || [], Level: src.Level || "",
    CreatedAt: src.CreatedAt || now, UpdatedAt: now
  };
}

const c1 = courseDoc(P1, ".NET Grundlagen",
  ".NET Grundlagen (Kapitel 1–6)", ".NET Fundamentals (Chapters 1–6)", ".NET Основы (главы 1–6)", part1);
const c2 = courseDoc(P2, ".NET Aufbau",
  ".NET Aufbau (Kapitel 7–12)", ".NET Advanced (Chapters 7–12)", ".NET Продвинутый (главы 7–12)", part2);

const c1Contents = part1.reduce(function (s, ch) { return s + (ch.ChapterContent || []).length; }, 0);
const c2Contents = part2.reduce(function (s, ch) { return s + (ch.ChapterContent || []).length; }, 0);
print("Original _id=" + origId + "  Kapitel gesamt=" + chapters.length);
print("  -> Teil 1 (Grundlagen): Kapitel=" + part1.length + " Inhalte=" + c1Contents + "  _id=" + P1);
print("  -> Teil 2 (Aufbau):     Kapitel=" + part2.length + " Inhalte=" + c2Contents + "  _id=" + P2);

// questionlists zuordnen (nur zaehlen bei DryRun).
const qls = d.questionlists.find({ CourseId: origId }).toArray();
let n1 = 0, n2 = 0, nu = 0;
qls.forEach(function (q) {
  const part = contentToPart[String(q.ChapterContentId)];
  if (part === P1) n1++; else if (part === P2) n2++; else nu++;
});
print("questionlists gesamt=" + qls.length + "  -> Teil1=" + n1 + " Teil2=" + n2 + " unmapped=" + nu);
if (nu > 0) { print("ABBRUCH: " + nu + " questionlists nicht zuordenbar."); quit(2); }

if (DRYRUN) { print("DRY-RUN: Es wird nichts geschrieben."); quit(0); }

// Schreiben (ersetzt vorhandene Teil-Kurse, haengt questionlists um, loescht Original).
d.courses.deleteMany({ _id: { $in: [P1, P2] } });
d.courses.insertMany([c1, c2]);
qls.forEach(function (q) {
  d.questionlists.updateOne({ _id: q._id }, { $set: { CourseId: contentToPart[String(q.ChapterContentId)] } });
});
const delOrig = d.courses.deleteOne({ _id: origId }).deletedCount;

print("GESCHRIEBEN: courses P1=" + d.courses.countDocuments({ _id: P1 }) +
      " P2=" + d.courses.countDocuments({ _id: P2 }) +
      " | questionlists Teil1=" + d.questionlists.countDocuments({ CourseId: P1 }) +
      " Teil2=" + d.questionlists.countDocuments({ CourseId: P2 }) +
      " | Original geloescht=" + delOrig);
print("FERTIG.");
'@

$js = $js.Replace('__TGT_DB__', ($TargetDb | ConvertTo-Json)).
          Replace('__DRYRUN__', $(if ($DryRun) { "true" } else { "false" }))

$b64js  = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($js))
$b64run = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes("mongosh --quiet mongodb://localhost:27017 /tmp/devedu-split.js"))

kubectl exec -n $Namespace $pod -- bash -c "echo $b64js | base64 -d > /tmp/devedu-split.js; echo $b64run | base64 -d > /tmp/devedu-split-run.sh"
if ($LASTEXITCODE -ne 0) { throw "Konnte Skript nicht in den Pod schreiben." }

if ($DryRun) { Write-Host "Starte DRY-RUN (nur lesen) ..." -ForegroundColor Yellow }
else { Write-Host "Splitte '.NET' in Grundlagen + Aufbau ..." -ForegroundColor Green }

try {
    kubectl exec -n $Namespace $pod -- bash /tmp/devedu-split-run.sh
    $code = $LASTEXITCODE
} finally {
    kubectl exec -n $Namespace $pod -- rm -f /tmp/devedu-split.js /tmp/devedu-split-run.sh | Out-Null
}
if ($code -ne 0) { throw "mongosh endete mit Exit-Code $code." }

Write-Host ""
Write-Host "Erledigt." -ForegroundColor Green
