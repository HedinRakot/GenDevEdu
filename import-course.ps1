<#
.SYNOPSIS
    Importiert EINEN Kurs aus der normalisierten Quell-DB (z.B. WebSitesDesignerTool)
    und transformiert ihn in das EINGEBETTETE DevEdu-Schema der lokalen DB im
    Kind-Cluster.

.DESCRIPTION
    Die Quelle ist normalisiert (eigene Collections: Courses, Chapters,
    ChapterContents, QuestionLists, Questions, QuestionToQuestionLists), waehrend
    das DevEdu-Modell alles einbettet (Course.Chapters[].ChapterContent[],
    QuestionList.Questions[]). Dieses Skript baut die eingebetteten Dokumente auf:

      Courses          -> courses (1 Dokument, Chapters eingebettet)
      Chapters         -> Course.Chapters[]            (via CourseId)
      ChapterContents  -> Chapter.ChapterContent[]     (via ChapterId)
      QuestionLists    -> questionlists                (nur die von Inhalten
                          referenzierten; ChapterContentId zurueckgesetzt)
      Questions        -> QuestionList.Questions[]     (via QuestionToQuestionLists)
      Answers          -> Question.Answers[]           (_id -> Id)

    Es laeuft via mongosh IM Mongo-Pod: mongosh ist primaer mit der QUELLE verbunden
    (so funktionieren mongodb+srv-URIs), das Ziel wird per new Mongo("localhost")
    geoeffnet. Der Connection-String wird nur innerhalb des Pods aus einer Datei
    gelesen.

    Idempotent: Im Ziel wird vorher genau dieser Kurs (per _id) und seine
    questionlists (per CourseId) geloescht. Andere lokale Kurse (z.B. der Seed
    "CSharp Basics") bleiben unberuehrt.

.PARAMETER Course
    Kurs-Selektor: Name (z.B. ".NET") ODER dessen _id (Hex). Default: ".NET".

.PARAMETER SourceDb
    Quell-Datenbank. Default: WebSitesDesignerTool

.PARAMETER TargetDb
    Lokale Ziel-DB. Default: devedu

.PARAMETER Status
    Status, mit dem der Kurs angelegt wird. Default: Published (sonst nicht im Katalog).

.PARAMETER DryRun
    Nur lesen + Zaehlung anzeigen, nichts schreiben.

.PARAMETER SourceUriFile
    Datei mit dem Connection-String der Quelle.
#>
[CmdletBinding()]
param(
    [string]$Course = ".NET",
    [string]$SourceDb = "WebSitesDesignerTool",
    [string]$TargetDb = "devedu",
    [string]$Status = "Published",
    [switch]$DryRun,
    [string]$SourceUri = $env:DEVEDU_SOURCE_URI,
    [string]$SourceUriFile = "C:\Users\larsl\AppData\Local\Temp\claude\C--Users-larsl-ssd-data-Developer-GenDevEdu-Feature\9d7c3596-9bed-4044-8428-433efc428cbc\scratchpad\source-uri.txt",
    [string]$Namespace = "devedu"
)

$ErrorActionPreference = "Stop"

# Quelle: -SourceUri > Env > Datei (umschliessende Quotes/Whitespace werden entfernt)
if ([string]::IsNullOrWhiteSpace($SourceUri) -and (Test-Path $SourceUriFile)) {
    $SourceUri = (Get-Content -Raw $SourceUriFile).Trim().Trim('"').Trim("'").Trim()
}
if ([string]::IsNullOrWhiteSpace($SourceUri)) {
    throw "Keine Quelle. Setze -SourceUri, Env DEVEDU_SOURCE_URI oder lege $SourceUriFile an."
}

Write-Host "Suche Mongo-Pod im Namespace '$Namespace' ..." -ForegroundColor Cyan
$pod = (kubectl get pods -n $Namespace -l app=mongo -o jsonpath="{.items[0].metadata.name}")
if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($pod)) {
    throw "Kein Mongo-Pod gefunden. (kubectl get pods -n $Namespace)"
}
Write-Host "  Pod: $pod" -ForegroundColor DarkGray

# ─── ETL-Skript (mongosh primaer = Quelle; Ziel via new Mongo localhost) ─────────
$js = @'
const SRC_DB  = __SRC_DB__;
const TGT_URI = "mongodb://localhost:27017";
const TGT_DB  = __TGT_DB__;
const SEL     = __SEL__;
const STATUS  = __STATUS__;
const DRYRUN  = __DRYRUN__;

const src = db.getMongo().getDB(SRC_DB);   // mongosh-Hauptverbindung = Quelle
const now = new Date();

// Hilfen fuer ObjectId/String-gemischte Referenzen
function idIn(strs) {
  const arr = [];
  strs.forEach(function (s) { arr.push(s); try { arr.push(ObjectId(s)); } catch (e) {} });
  return { $in: arr };
}

// 1) Kurs aufloesen (Name oder Hex-_id)
let course = src.Courses.findOne({ Name: SEL });
if (!course) { try { course = src.Courses.findOne({ _id: ObjectId(SEL) }); } catch (e) {} }
if (!course) { course = src.Courses.findOne({ _id: SEL }); }
if (!course) { print("ERROR: Kurs nicht gefunden: " + SEL); quit(2); }
const cid = String(course._id);
print("Kurs: " + (course.Name || "(ohne Name)") + "   _id=" + cid);

// 2) Kapitel + Inhalte einbetten
const chapters = src.Chapters.find({ CourseId: cid }).toArray()
  .sort(function (a, b) { return (a.SortOrder || 0) - (b.SortOrder || 0); });

const referencedLists = {};   // QuestionListId -> ChapterContent.Id (Owner)

function buildContent(cc) {
  const c = {
    _id: String(cc._id),
    ElementId: String(cc._id),
    Name: cc.Name || "",
    CourseId: cid,
    ChapterId: String(cc.ChapterId || ""),
    Titel: cc.Titel || { Items: [] },
    ContentType: (cc.ContentType == null ? 0 : cc.ContentType),
    LessonText: cc.LessonText || "",
    LessonTexte: cc.LessonTexte || { Items: [] },
    VideoUrl: cc.VideoUrl || "",
    QuestionListId: cc.QuestionListId || "",
    SortOrder: cc.SortOrder || 0,
    AverageRank: cc.AverageRank || 0,
    MaxRank: cc.MaxRank || 0
  };
  if (c.QuestionListId) referencedLists[c.QuestionListId] = c._id;
  return c;
}

const builtChapters = chapters.map(function (ch) {
  const chId = String(ch._id);
  const contents = src.ChapterContents.find({ ChapterId: chId }).toArray()
    .sort(function (a, b) { return (a.SortOrder || 0) - (b.SortOrder || 0); })
    .map(buildContent);
  return {
    _id: chId,
    ElementId: chId,
    Name: ch.Name || "",
    CourseId: cid,
    Titel: ch.Titel || { Items: [] },
    SortOrder: ch.SortOrder || 0,
    Show: (ch.Show == null ? true : ch.Show),
    ChapterContent: contents,
    ChapterQuizId: null,
    PassThresholdPercent: 60,
    MaxAttempts: 0
  };
});

const courseDoc = {
  _id: cid,
  ElementId: cid,
  Name: course.Name || "",
  Titel: course.Titel || { Items: [] },
  AuthorId: "import",
  Status: STATUS,
  Chapters: builtChapters,
  Tags: [],
  Level: "",
  CreatedAt: now,
  UpdatedAt: now
};

// 3) Referenzierte QuestionLists + Fragen aufbauen
function buildQuestion(q) {
  const answers = (q.Answers || []).map(function (a) {
    return {
      _id: String(a._id || ""),
      IsCorrect: !!a.IsCorrect,
      Titel: a.Titel || { Items: [] },
      Comment: a.Comment || ""
    };
  });
  return {
    _id: String(q._id),
    ElementId: String(q._id),
    Name: q.Name || "",
    Titel: q.Titel || { Items: [] },
    QuestionType: (q.QuestionType == null ? 0 : q.QuestionType),
    Answers: answers,
    AnswerValue: q.AnswerValue || "",
    Code: q.Code || null
  };
}

const qlDocs = [];
Object.keys(referencedLists).forEach(function (lid) {
  const joins = src.QuestionToQuestionLists.find({ QuestionListId: lid }).toArray();
  const qIds = joins.map(function (j) { return j.QuestionId; });
  const qDocs = qIds.length ? src.Questions.find({ _id: idIn(qIds) }).toArray() : [];
  const byId = {}; qDocs.forEach(function (q) { byId[String(q._id)] = q; });
  const ordered = qIds.map(function (s) { return byId[s]; }).filter(function (x) { return x; });
  qlDocs.push({
    _id: lid,
    ElementId: lid,
    CourseId: cid,
    ChapterContentId: referencedLists[lid] || "",
    ChapterId: "",
    Questions: ordered.map(buildQuestion)
  });
});

const contentCount = builtChapters.reduce(function (s, c) { return s + c.ChapterContent.length; }, 0);
const qCount = qlDocs.reduce(function (s, q) { return s + q.Questions.length; }, 0);
print("Kapitel=" + builtChapters.length + " | Inhalte=" + contentCount +
      " | QuestionLists=" + qlDocs.length + " | Fragen=" + qCount);

if (DRYRUN) { print("DRY-RUN: Es wird nichts geschrieben."); quit(0); }

// 4) Ins Ziel schreiben (scoped, idempotent)
const tgt = new Mongo(TGT_URI).getDB(TGT_DB);
const delC = tgt.courses.deleteOne({ _id: cid }).deletedCount;
const delQ = tgt.questionlists.deleteMany({ CourseId: cid }).deletedCount;
tgt.courses.insertOne(courseDoc);
if (qlDocs.length) tgt.questionlists.insertMany(qlDocs);
print("Ziel: geloescht courses=" + delC + " questionlists=" + delQ +
      "  ->  courses=" + tgt.courses.countDocuments({ _id: cid }) +
      " questionlists=" + tgt.questionlists.countDocuments({ CourseId: cid }));
print("FERTIG.");
'@

$js = $js.Replace('__SRC_DB__', ($SourceDb | ConvertTo-Json)).
          Replace('__TGT_DB__', ($TargetDb | ConvertTo-Json)).
          Replace('__SEL__',    ($Course   | ConvertTo-Json)).
          Replace('__STATUS__', ($Status   | ConvertTo-Json)).
          Replace('__DRYRUN__', $(if ($DryRun) { "true" } else { "false" }))

# ─── In den Pod schieben (base64 -> keine Quoting-Probleme) + ausfuehren ─────────
$b64js  = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($js))
$b64uri = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($SourceUri))
$b64run = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes("mongosh --quiet `"`$(cat /tmp/devedu-imp-uri)`" /tmp/devedu-imp.js"))

kubectl exec -n $Namespace $pod -- bash -c "echo $b64js | base64 -d > /tmp/devedu-imp.js; echo $b64uri | base64 -d > /tmp/devedu-imp-uri; echo $b64run | base64 -d > /tmp/devedu-imp-run.sh"
if ($LASTEXITCODE -ne 0) { throw "Konnte Skript/URI nicht in den Pod schreiben." }

if ($DryRun) { Write-Host "Starte DRY-RUN (nur lesen) ..." -ForegroundColor Yellow }
else { Write-Host "Starte Import (Quelle -> lokaler Cluster) ..." -ForegroundColor Green }

try {
    kubectl exec -n $Namespace $pod -- bash /tmp/devedu-imp-run.sh
    $code = $LASTEXITCODE
} finally {
    kubectl exec -n $Namespace $pod -- rm -f /tmp/devedu-imp.js /tmp/devedu-imp-uri /tmp/devedu-imp-run.sh | Out-Null
}

if ($code -ne 0) {
    throw "mongosh endete mit Exit-Code $code. (Tipp bei Atlas: oeffentliche IP dieser Maschine ggf. in Atlas > Network Access freigeben.)"
}
Write-Host ""
Write-Host "Erledigt." -ForegroundColor Green

# ─── Selbstheilung: Inhalts-Overlay (DE/EN-Uebersetzungen + neue Kapitel) ─────────
# Der aus der Prod-Quelle importierte Kurs ist unvollstaendig (nur-Russisch-Kapitel,
# leere Ueberschriften, leere hintere Kapitel). Die im Repo gepflegten Korrekturen
# werden direkt nach dem Import wieder angewandt, damit ein Re-Import nicht die
# unvollstaendige Prod-Fassung hinterlaesst. Nur fuer den ".NET"-Kurs relevant.
$applyScript = Join-Path $PSScriptRoot "apply-course-content.ps1"
$overlayManifest = Join-Path $PSScriptRoot "course-content\dotnet\manifest.json"
if (-not $DryRun -and (Test-Path $applyScript) -and (Test-Path $overlayManifest)) {
    Write-Host ""
    Write-Host "Wende Inhalts-Overlay an (apply-course-content.ps1) ..." -ForegroundColor Cyan
    & $applyScript -TargetDb $TargetDb -Namespace $Namespace
}
