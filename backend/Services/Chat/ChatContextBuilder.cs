using DevEdu.Api.Models;
using MongoDB.Driver;

namespace DevEdu.Api.Services.Chat;

/// <summary>
/// Baut aus einem <see cref="ChatContext"/> (Kurs/Kapitel/Inhalt/Frage) einen
/// Text-Block, der in den System-Prompt injiziert wird — damit der Tutor weiß,
/// worauf sich „das hier“/„diese Aufgabe“ bezieht. Lädt die Inhalte aus Mongo.
/// </summary>
public class ChatContextBuilder
{
    private const int LessonCharCap = 1500;
    private readonly MongoContext _db;

    public ChatContextBuilder(MongoContext db) => _db = db;

    public async Task<string?> BuildAsync(ChatContext? ctx, string? userId, CancellationToken ct)
    {
        if (ctx is null) return null;

        var lines = new List<string>();

        // Kurs finden (direkt per Id, sonst über Kapitel/Inhalt).
        Course? course = null;
        if (!string.IsNullOrEmpty(ctx.CourseId))
            course = await _db.Courses.Find(c => c.Id == ctx.CourseId || c.ElementId == ctx.CourseId).FirstOrDefaultAsync(ct);
        if (course is null && !string.IsNullOrEmpty(ctx.ContentId))
            course = await _db.Courses.Find(c => c.Chapters.Any(ch => ch.ChapterContent.Any(cc => cc.Id == ctx.ContentId))).FirstOrDefaultAsync(ct);
        if (course is null && !string.IsNullOrEmpty(ctx.ChapterId))
            course = await _db.Courses.Find(c => c.Chapters.Any(ch => ch.Id == ctx.ChapterId)).FirstOrDefaultAsync(ct);

        if (course is not null)
        {
            var courseName = Mappers.PrimaryText(course.Titel);
            lines.Add("Kurs: " + (string.IsNullOrWhiteSpace(courseName) ? course.Name : courseName));

            Chapter? chapter = null;
            ChapterContent? content = null;
            if (!string.IsNullOrEmpty(ctx.ChapterId))
                chapter = course.Chapters.FirstOrDefault(ch => ch.Id == ctx.ChapterId);
            if (!string.IsNullOrEmpty(ctx.ContentId))
                foreach (var ch in course.Chapters)
                {
                    var cc = ch.ChapterContent.FirstOrDefault(x => x.Id == ctx.ContentId);
                    if (cc is not null) { content = cc; chapter ??= ch; break; }
                }

            if (chapter is not null) lines.Add("Kapitel: " + Mappers.PrimaryText(chapter.Titel));
            if (content is not null)
            {
                lines.Add("Lektion: " + Mappers.PrimaryText(content.Titel));
                var body = Mappers.PrimaryText(content.LessonTexte);
                if (string.IsNullOrWhiteSpace(body)) body = content.LessonText;
                if (!string.IsNullOrWhiteSpace(body)) lines.Add("Lektionstext:\n" + Truncate(body, LessonCharCap));
            }
        }

        // Aktuelle Frage (ohne Antworten/Lösung — der Tutor soll Hinweise geben, nicht lösen).
        if (!string.IsNullOrEmpty(ctx.QuestionId))
        {
            var ql = await _db.QuestionLists.Find(q => q.Questions.Any(x => x.Id == ctx.QuestionId)).FirstOrDefaultAsync(ct);
            var question = ql?.Questions.FirstOrDefault(x => x.Id == ctx.QuestionId);
            if (question is { QuestionType: MobileQuestionType.Code, Code: not null })
                await AppendCodeHelpAsync(lines, question, ctx.QuestionId!, userId, ct);
            else if (question is not null && !string.IsNullOrEmpty(ctx.SelectedAnswer))
                AppendQuizExplanation(lines, question, ctx.SelectedAnswer);
            else if (question is not null)
                lines.Add("Aktuelle Frage: " + Mappers.PrimaryText(question.Titel));
        }

        if (lines.Count == 0) return null;

        return "=== Kontext (worauf sich der Lerner gerade bezieht) ===\n"
             + string.Join("\n", lines)
             + "\n\nBeziehe dich auf diesen Kontext, wenn der Lerner \"das hier\" / \"diese Aufgabe\" meint. "
             + "Verrate bei Programmieraufgaben keine vollständige Musterlösung — gib gezielte Hinweise.";
    }

    /// <summary>
    /// B6: Kontext für Code-Aufgaben-Hilfe — Aufgabe, Startcode und die letzte
    /// (nicht bestandene) Einreichung des Lerners inkl. Fehlerausgabe. Die
    /// autor-interne SolutionCode wird bewusst NIE übergeben (Guardrail im Prompt).
    /// </summary>
    private async Task AppendCodeHelpAsync(
        List<string> lines, Question question, string questionId, string? userId, CancellationToken ct)
    {
        lines.Add("Programmieraufgabe: " + Mappers.PrimaryText(question.Titel));
        var starter = question.Code!.StarterCode;
        if (!string.IsNullOrWhiteSpace(starter))
            lines.Add("Startcode:\n" + Truncate(starter, 800));

        if (!string.IsNullOrEmpty(userId))
        {
            var sub = await _db.CodeSubmissions
                .Find(s => s.UserId == userId && s.QuestionId == questionId)
                .SortByDescending(s => s.CreatedAt)
                .FirstOrDefaultAsync(ct);

            if (sub is not null && sub.Outcome != CodeRunOutcome.Passed)
            {
                if (!string.IsNullOrWhiteSpace(sub.CompileError))
                    lines.Add("Letzter Versuch — Compile-Fehler:\n" + Truncate(sub.CompileError, 800));
                else
                {
                    var failing = sub.TestResults
                        .Where(r => !r.Passed && !r.Hidden)
                        .Take(2)
                        .Select(r => $"- Eingabe {Show(r.Input)} → erwartet {Show(r.ExpectedOutput)}, bekommen {Show(r.ActualOutput)}")
                        .ToList();
                    lines.Add(failing.Count > 0
                        ? "Letzter Versuch — fehlgeschlagene Tests:\n" + string.Join("\n", failing)
                        : $"Letzter Versuch: {sub.PassedCount}/{sub.TotalCount} Tests bestanden.");
                }
            }
        }

        lines.Add("WICHTIG: Der Lerner arbeitet an dieser Aufgabe. Gib gezielte Hinweise und "
                + "erkläre Fehler Schritt für Schritt, aber gib NIEMALS die vollständige Lösung als fertigen Code aus.");
    }

    /// <summary>
    /// B7: Kontext zur Erklärung einer beantworteten Quizfrage — Optionen mit
    /// Korrektheit + die Wahl des Lerners. Wird nur bei gesetzter SelectedAnswer
    /// erzeugt (also nach dem Beantworten), damit vorher keine Lösung verraten wird.
    /// </summary>
    private static void AppendQuizExplanation(List<string> lines, Question question, string selected)
    {
        lines.Add("Quizfrage: " + Mappers.PrimaryText(question.Titel));
        if (question.Answers.Count > 0)
        {
            var opts = question.Answers.Select(a =>
                $"- {Mappers.PrimaryText(a.Titel)}{(a.IsCorrect ? " (richtig)" : "")}");
            lines.Add("Antwortoptionen:\n" + string.Join("\n", opts));
        }
        lines.Add("Der Lerner hat gewählt: " + selected);
        lines.Add("Erkläre verständlich, warum diese Wahl richtig oder falsch ist und "
                + "warum die korrekte Antwort korrekt ist. Wenn der Lerner um Übungsfragen bittet, "
                + "erzeuge passende neue Übungsfragen (mit Lösung) zum Thema.");
    }

    private static string Show(string? s) => string.IsNullOrEmpty(s) ? "(leer)" : s.Replace("\n", "\\n");

    private static string Truncate(string s, int max) =>
        s.Length <= max ? s : s[..max] + " …";
}
