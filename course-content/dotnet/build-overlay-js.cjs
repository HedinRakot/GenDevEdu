// Baut das mongosh-Migrationsskript fuer apply-course-content.ps1.
// Liest manifest.json + die Markdown-Body-Dateien, bettet alles als OV-Objekt ein
// und haengt die (statische) Migrationslogik an. Node erledigt die JSON-Serialisierung
// in Millisekunden (PowerShell 5.1 ConvertTo-Json ist dafuer zu langsam).
//
// Aufruf: node build-overlay-js.cjs <contentDir> <targetDb> <true|false dryRun> <outJsPath>
'use strict';
const fs = require('fs');
const path = require('path');

const [, , contentDir, targetDb, dryRunArg, outPath] = process.argv;
if (!contentDir || !targetDb || !outPath) {
  console.error('Usage: node build-overlay-js.cjs <contentDir> <targetDb> <true|false> <outJsPath>');
  process.exit(1);
}
const dryRun = String(dryRunArg) === 'true';

const manifest = JSON.parse(fs.readFileSync(path.join(contentDir, 'manifest.json'), 'utf8'));

function readBody(slug, id, lang) {
  const p = path.join(contentDir, slug, id + '.' + lang + '.md');
  if (!fs.existsSync(p)) { throw new Error('Body-Datei fehlt: ' + p); }
  return fs.readFileSync(p, 'utf8');
}

let bodyCount = 0;
for (const ch of manifest.chapters || []) {
  for (const cc of ch.contents || []) {
    if (cc.bodies && cc.bodies.length) {
      cc.body = {};
      for (const l of cc.bodies) { cc.body[l] = readBody(ch.slug, cc._id, l); bodyCount++; }
    }
  }
  for (const nc of ch.newContents || []) {
    if (nc.bodies && nc.bodies.length) {
      nc.body = {};
      for (const l of nc.bodies) { nc.body[l] = readBody(ch.slug, nc._id, l); bodyCount++; }
    }
  }
}

const header =
  'const TGT_DB = ' + JSON.stringify(targetDb) + ';\n' +
  'const DRYRUN = ' + (dryRun ? 'true' : 'false') + ';\n' +
  'const OV = ' + JSON.stringify(manifest) + ';\n';

// ── Statische Migrationslogik (laeuft IM Pod gegen die lokale DB) ────────────────
const logic = `
const LANG = { ru: 0, de: 1, en: 2 };
const tgt = db.getMongo().getDB(TGT_DB);   // mongosh-Hauptverbindung = lokale DB

const course = tgt.courses.findOne({ _id: OV.courseId });
if (!course) { print("ERROR: Kurs nicht gefunden: " + OV.courseId); quit(2); }

function upsertItem(texte, lang, text) {
  if (!texte.Items) texte.Items = [];
  const it = texte.Items.find(function (i) { return i.Language === lang; });
  if (it) { it.Text = text; } else { texte.Items.push({ Text: text, Language: lang }); }
}
function decodeOnce(s) {
  if (!s) return "";
  if (s.indexOf("&lt;") < 0 && s.indexOf("&gt;") < 0 && s.indexOf("&amp;") < 0) return s;
  return s.replace(/&lt;/g, "<").replace(/&gt;/g, ">")
          .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, "&");
}

const stats = { chTitles: 0, contentsUpdated: 0, newContents: 0, titleItems: 0, bodyItems: 0, warnings: [] };

(OV.chapters || []).forEach(function (ch) {
  const chapter = (course.Chapters || []).find(function (c) { return c._id === ch._id; });
  if (!chapter) { stats.warnings.push("Kapitel fehlt: " + ch._id); return; }

  if (ch.title) {
    if (!chapter.Titel) chapter.Titel = { Items: [] };
    if (ch.title.de != null) { upsertItem(chapter.Titel, LANG.de, ch.title.de); stats.chTitles++; }
    if (ch.title.en != null) { upsertItem(chapter.Titel, LANG.en, ch.title.en); }
  }

  (ch.contents || []).forEach(function (cc) {
    const content = (chapter.ChapterContent || []).find(function (x) { return x._id === cc._id; });
    if (!content) { stats.warnings.push("Inhalt fehlt: " + cc._id); return; }
    if (!content.Titel) content.Titel = { Items: [] };
    if (cc.titles) {
      Object.keys(cc.titles).forEach(function (k) {
        if (cc.titles[k] != null) { upsertItem(content.Titel, LANG[k], cc.titles[k]); stats.titleItems++; }
      });
    }
    if (!content.LessonTexte) content.LessonTexte = { Items: [] };
    if (cc.ruFromLessonText) {
      const ru = decodeOnce(content.LessonText || "");
      if (ru) upsertItem(content.LessonTexte, LANG.ru, ru);
    }
    if (cc.body) {
      Object.keys(cc.body).forEach(function (lang) {
        if (cc.body[lang] != null) { upsertItem(content.LessonTexte, LANG[lang], cc.body[lang]); stats.bodyItems++; }
      });
    }
    if (cc.clearLessonText) content.LessonText = "";
    stats.contentsUpdated++;
  });

  (ch.newContents || []).forEach(function (nc) {
    let content = (chapter.ChapterContent || []).find(function (x) { return x._id === nc._id; });
    const isNew = !content;
    if (isNew) {
      content = {
        _id: nc._id, ElementId: nc._id, Name: "", CourseId: OV.courseId, ChapterId: ch._id,
        Titel: { Items: [] }, ContentType: (nc.type == null ? 0 : nc.type),
        LessonText: "", LessonTexte: { Items: [] }, VideoUrl: "", QuestionListId: "",
        SortOrder: nc.sortOrder || 0, AverageRank: 0, MaxRank: 0
      };
    }
    if (!content.Titel) content.Titel = { Items: [] };
    if (nc.titles) {
      Object.keys(nc.titles).forEach(function (k) {
        if (nc.titles[k] != null) upsertItem(content.Titel, LANG[k], nc.titles[k]);
      });
    }
    if (!content.LessonTexte) content.LessonTexte = { Items: [] };
    if (nc.body) {
      Object.keys(nc.body).forEach(function (lang) {
        if (nc.body[lang] != null) upsertItem(content.LessonTexte, LANG[lang], nc.body[lang]);
      });
    }
    content.SortOrder = (nc.sortOrder != null ? nc.sortOrder : (content.SortOrder || 0));
    if (isNew) {
      if (!chapter.ChapterContent) chapter.ChapterContent = [];
      chapter.ChapterContent.push(content);
      stats.newContents++;
    }
  });

  if (chapter.ChapterContent && chapter.ChapterContent.length) {
    chapter.ChapterContent.sort(function (a, b) { return (a.SortOrder || 0) - (b.SortOrder || 0); });
  }
});

print("Stats: " + JSON.stringify(stats));
if (stats.warnings.length) print("WARNUNGEN: " + JSON.stringify(stats.warnings));

if (DRYRUN) { print("DRY-RUN: Es wird nichts geschrieben."); quit(0); }

course.UpdatedAt = new Date();
tgt.courses.replaceOne({ _id: OV.courseId }, course);
print("APPLIED -> courses.replaceOne ok (" + OV.courseId + ")");
print("FERTIG.");
`;

fs.writeFileSync(outPath, header + logic, 'utf8');
console.log(bodyCount + ' Body-Datei(en) eingebettet -> ' + outPath);
