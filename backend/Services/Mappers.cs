using DevEdu.Api.Dtos;
using DevEdu.Api.Models;

namespace DevEdu.Api.Services;

public static class Mappers
{
    // ─── Course ──────────────────────────────────────────────────────────────

    public static CourseDto ToCourseDto(Course c) =>
        new(c.ElementId, c.Name, c.Titel, c.Status);

    public static ChapterResponseDto ToChapterResponseDto(Chapter ch) =>
        new(ch.ElementId, ch.Name, ch.CourseId, ch.Titel, ch.SortOrder, ch.Show,
            Rank: 0, Completed: false,
            Questions: new List<object>(),
            ChapterContent: new List<object>(),
            HasQuiz: !string.IsNullOrEmpty(ch.ChapterQuizId),
            PassThresholdPercent: ch.PassThresholdPercent,
            MaxAttempts: ch.MaxAttempts);

    public static ChapterContentDto ToChapterContentDto(ChapterContent cc) =>
        new(cc.ElementId, cc.Name, cc.CourseId, cc.ChapterId, cc.Titel,
            (int)cc.ContentType, cc.LessonText, cc.LessonTexte,
            cc.VideoUrl, cc.QuestionListId, cc.SortOrder,
            QuestionLists: new List<object>(),
            cc.AverageRank, cc.MaxRank, Completed: false);

    // ─── Questions ────────────────────────────────────────────────────────────

    // Solange nicht aufgelöst wird (Learner vor dem Absenden), dürfen weder die
    // Korrektheit, der Erklär-Kommentar noch der Referenz-Antwortwert mitgeliefert
    // werden – die Auswertung läuft serverseitig über POST /api/questions/{id}/attempt.
    public static AnswerResponseDto ToAnswerDto(Answer a, bool reveal) =>
        new(a.Id, reveal && a.IsCorrect, a.Titel, reveal ? a.Comment : string.Empty);

    public static QuestionResponseDto ToQuestionDto(Question q, bool revealAnswers) =>
        new(q.ElementId, q.Name, q.Titel,
            (int)q.QuestionType,
            q.Answers.Select(a => ToAnswerDto(a, revealAnswers)).ToList(),
            revealAnswers ? q.AnswerValue : string.Empty,
            q.Code is null ? null : ToCodeQuestionDto(q.Code, revealAnswers));

    public static QuestionListResponseModel ToQuestionListModel(QuestionList ql, bool revealAnswers) =>
        new(ql.Questions.Select(q => ToQuestionDto(q, revealAnswers)).ToList());

    // ─── Code-Aufgaben ─────────────────────────────────────────────────────────

    // SolutionCode ist autor-intern; versteckte Testfälle dürfen Lernern weder
    // Input noch ExpectedOutput zeigen. reveal == Autor/Admin.
    public static CodeQuestionResponseDto ToCodeQuestionDto(CodeQuestion code, bool reveal) =>
        new((int)code.Language, code.StarterCode, code.TimeLimitMs, code.MemoryLimitMb,
            code.TestCases.Select(tc => new CodeTestCasePreviewDto(
                tc.Id, tc.Hidden,
                tc.Hidden && !reveal ? null : tc.Input,
                tc.Hidden && !reveal ? null : tc.ExpectedOutput)).ToList(),
            reveal ? code.SolutionCode : null);

    public static CodeSubmissionResultDto ToCodeSubmissionDto(CodeSubmission sub, bool reveal) =>
        new(sub.Id, sub.QuestionId, sub.Status.ToString(), sub.Outcome.ToString(),
            sub.PassedCount, sub.TotalCount, sub.DurationMs, sub.CompileError, sub.ErrorMessage,
            sub.TestResults.Select(r =>
            {
                bool hide = r.Hidden && !reveal;
                return new CodeTestCaseResultDto(
                    r.TestCaseId, r.Hidden, r.Passed, r.Outcome.ToString(), r.DurationMs,
                    hide ? null : r.Input,
                    hide ? null : r.ExpectedOutput,
                    hide ? null : r.ActualOutput,
                    hide ? null : r.Stderr);
            }).ToList());

    // ─── Kapitel-Abschlussquiz (F8) ────────────────────────────────────────────

    public static ChapterQuizDto ToChapterQuizDto(
        QuestionList ql, Chapter chapter, bool reveal,
        int attemptsUsed, int? bestPercent, bool passed) =>
        new(chapter.Id,
            chapter.PassThresholdPercent,
            chapter.MaxAttempts,
            ql.Questions.Select(q => ToQuestionDto(q, reveal)).ToList(),
            attemptsUsed,
            bestPercent,
            passed,
            AttemptsExhausted: chapter.MaxAttempts > 0 && attemptsUsed >= chapter.MaxAttempts);

    public static ChapterQuizResultDto ToChapterQuizResultDto(
        QuestionList ql, Chapter chapter, int correctCount, int percent, bool passed,
        int attemptNo, int attemptsRemaining) =>
        new(correctCount,
            ql.Questions.Count,
            percent,
            passed,
            attemptNo,
            chapter.MaxAttempts,
            attemptsRemaining,
            // Nach der Abgabe werden die korrekten Antworten + Erklärungen aufgedeckt.
            ql.Questions.Select(q => ToQuestionDto(q, revealAnswers: true)).ToList());

    // ─── Helpers ─────────────────────────────────────────────────────────────

    // Baut eine Answer/Question aus einem Author-Create-Request (geteilt von
    // QuestionService und ChapterQuizService).
    public static Answer ToAnswer(CreateAnswerRequest ar) => new()
    {
        IsCorrect = ar.IsCorrect,
        Titel = BuildTexte(ar.TitelItems, string.Empty),
        Comment = ar.Comment ?? string.Empty,
    };

    public static Question ToQuestion(CreateQuestionRequest qr)
    {
        var qId = Guid.NewGuid().ToString("N");
        var type = (MobileQuestionType)qr.QuestionType;
        return new Question
        {
            Id = qId,
            ElementId = qId,
            Name = qr.Name ?? string.Empty,
            Titel = BuildTexte(qr.TitelItems, qr.Name ?? string.Empty),
            QuestionType = type,
            Answers = (qr.Answers ?? new()).Select(ToAnswer).ToList(),
            AnswerValue = qr.AnswerValue ?? string.Empty,
            Code = type == MobileQuestionType.Code && qr.Code is not null
                ? new CodeQuestion
                {
                    Language = (CodeLanguage)qr.Code.Language,
                    StarterCode = qr.Code.StarterCode ?? string.Empty,
                    SolutionCode = qr.Code.SolutionCode ?? string.Empty,
                    TimeLimitMs = qr.Code.TimeLimitMs ?? 5000,
                    MemoryLimitMb = qr.Code.MemoryLimitMb ?? 256,
                    TestCases = (qr.Code.TestCases ?? new()).Select(tc => new CodeTestCase
                    {
                        Input = tc.Input ?? string.Empty,
                        ExpectedOutput = tc.ExpectedOutput ?? string.Empty,
                        Hidden = tc.Hidden,
                    }).ToList(),
                }
                : null,
        };
    }

    public static Texte BuildTexte(List<TextItemDto>? items, string fallbackName) =>
        new()
        {
            Items = items?.Select(i => new TextItem { Text = i.Text, Language = i.Language }).ToList()
                    ?? new List<TextItem> { new() { Text = fallbackName, Language = 1 } }
        };

    public static string PrimaryText(Texte t) =>
        t.Items.FirstOrDefault(i => i.Language == 1)?.Text   // German preferred
        ?? t.Items.FirstOrDefault()?.Text
        ?? string.Empty;
}
