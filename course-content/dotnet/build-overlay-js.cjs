// Baut das mongosh-Migrationsskript fuer apply-course-content.ps1.
// Liest manifest.json + die Markdown-Body-Dateien (Lektionen) sowie optional
// quizzes.json (Quiz-Uebersetzungen + neue Quizze), bettet alles als OV-Objekt ein
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

// Optional: Quizze (Frage-/Antwort-Uebersetzungen + neue Quizze)
let quizCount = 0;
const quizzesPath = path.join(contentDir, 'quizzes.json');
if (fs.existsSync(quizzesPath)) {
  const quizzes = JSON.parse(fs.readFileSync(quizzesPath, 'utf8'));
  // _comment-Pseudo-Eintraege ignorieren (haben kein questions/_id-QL-Format ist ok)
  manifest.quizzes = quizzes;
  quizCount = quizzes.length;
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

const stats = {
  chTitles: 0, contentsUpdated: 0, newContents: 0, titleItems: 0, bodyItems: 0,
  quizzes: 0, newQuestionLists: 0, newQuestions: 0, questionsUpdated: 0, newQuizContents: 0,
  warnings: []
};

// ── 1) Lektions-Inhalte (manifest.chapters) ─────────────────────────────────────
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

// ── 2) Quizze (questionlists + Quiz-Inhalte) ─────────────────────────────────────
const qlWrites = [];
(OV.quizzes || []).forEach(function (quiz) {
  if (!quiz || !quiz._id) return;   // _comment-/Leereintraege ueberspringen
  let ql = tgt.questionlists.findOne({ _id: quiz._id });
  const isNewQl = !ql;
  if (isNewQl) {
    ql = {
      _id: quiz._id, ElementId: quiz._id, CourseId: OV.courseId,
      ChapterContentId: (quiz.quizContent ? quiz.quizContent._id : ""), ChapterId: "", Questions: []
    };
    stats.newQuestionLists++;
  }

  (quiz.questions || []).forEach(function (qd) {
    let q = (ql.Questions || []).find(function (x) { return x._id === qd._id; });
    const isNewQ = !q;
    if (isNewQ) {
      q = { _id: qd._id, ElementId: qd._id, Name: "", Titel: { Items: [] },
            QuestionType: (qd.type == null ? 0 : qd.type), Answers: [], AnswerValue: "", Code: null };
    }
    if (qd.type != null) q.QuestionType = qd.type;
    if (qd.titles) Object.keys(qd.titles).forEach(function (k) {
      if (qd.titles[k] != null) upsertItem(q.Titel, LANG[k], qd.titles[k]);
    });
    (qd.answers || []).forEach(function (ad) {
      let a = (q.Answers || []).find(function (x) { return x._id === ad._id; });
      const isNewA = !a;
      if (isNewA) { a = { _id: ad._id, IsCorrect: !!ad.isCorrect, Titel: { Items: [] }, Comment: "" }; }
      if (ad.isCorrect != null) a.IsCorrect = !!ad.isCorrect;
      if (ad.titles) Object.keys(ad.titles).forEach(function (k) {
        if (ad.titles[k] != null) upsertItem(a.Titel, LANG[k], ad.titles[k]);
      });
      if (isNewA) { if (!q.Answers) q.Answers = []; q.Answers.push(a); }
    });
    if (isNewQ) { if (!ql.Questions) ql.Questions = []; ql.Questions.push(q); stats.newQuestions++; }
    else stats.questionsUpdated++;
  });

  qlWrites.push(ql);
  stats.quizzes++;

  // Quiz-Inhalt (ContentType=2) im Kapitel verankern (nur fuer neue Quizze gesetzt)
  if (quiz.quizContent && quiz.chapterId) {
    const chapter = (course.Chapters || []).find(function (c) { return c._id === quiz.chapterId; });
    if (!chapter) { stats.warnings.push("Quiz-Kapitel fehlt: " + quiz.chapterId); }
    else {
      let cc = (chapter.ChapterContent || []).find(function (x) { return x._id === quiz.quizContent._id; });
      const isNewC = !cc;
      if (isNewC) {
        cc = {
          _id: quiz.quizContent._id, ElementId: quiz.quizContent._id, Name: "", CourseId: OV.courseId,
          ChapterId: quiz.chapterId, Titel: { Items: [] }, ContentType: 2, LessonText: "",
          LessonTexte: { Items: [] }, VideoUrl: "", QuestionListId: quiz._id,
          SortOrder: (quiz.quizContent.sortOrder || 0), AverageRank: 0, MaxRank: 0
        };
      }
      cc.ContentType = 2;
      cc.QuestionListId = quiz._id;
      if (quiz.quizContent.sortOrder != null) cc.SortOrder = quiz.quizContent.sortOrder;
      if (quiz.quizContent.titles) Object.keys(quiz.quizContent.titles).forEach(function (k) {
        if (quiz.quizContent.titles[k] != null) upsertItem(cc.Titel, LANG[k], quiz.quizContent.titles[k]);
      });
      if (isNewC) {
        if (!chapter.ChapterContent) chapter.ChapterContent = [];
        chapter.ChapterContent.push(cc);
        stats.newQuizContents++;
      }
      chapter.ChapterContent.sort(function (a, b) { return (a.SortOrder || 0) - (b.SortOrder || 0); });
    }
  }
});

print("Stats: " + JSON.stringify(stats));
if (stats.warnings.length) print("WARNUNGEN: " + JSON.stringify(stats.warnings));

if (DRYRUN) { print("DRY-RUN: Es wird nichts geschrieben."); quit(0); }

// ── Schreiben ────────────────────────────────────────────────────────────────────
qlWrites.forEach(function (ql) {
  tgt.questionlists.replaceOne({ _id: ql._id }, ql, { upsert: true });
});
course.UpdatedAt = new Date();
tgt.courses.replaceOne({ _id: OV.courseId }, course);
print("APPLIED -> courses + questionlists (" + OV.courseId + ")");
print("FERTIG.");
`;

fs.writeFileSync(outPath, header + logic, 'utf8');
console.log(bodyCount + ' Body-Datei(en) + ' + quizCount + ' Quiz(ze) eingebettet -> ' + outPath);
