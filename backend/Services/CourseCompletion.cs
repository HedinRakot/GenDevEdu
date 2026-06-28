using DevEdu.Api.Models;

namespace DevEdu.Api.Services;

/// <summary>
/// Reine Abschluss-Logik (kein DB-Zugriff). Einzige Quelle der Wahrheit dafür, wann ein
/// Kapitel bzw. Kurs als abgeschlossen gilt — genutzt von GetChaptersAsync, StatsCalculator
/// und CertificateService (F8/F9/F10).
/// </summary>
public static class CourseCompletion
{
    /// <summary>Kapitel abgeschlossen: alle Inhalte fertig UND (falls vorhanden) Abschlussquiz bestanden.</summary>
    public static bool IsChapterComplete(
        Chapter ch, IReadOnlySet<string> completedContentIds, IReadOnlySet<string> passedQuizIds)
    {
        bool hasQuiz = !string.IsNullOrEmpty(ch.ChapterQuizId);
        bool quizPassed = passedQuizIds.Contains(ch.Id);
        bool contentDone = ch.ChapterContent.All(cc => completedContentIds.Contains(cc.ElementId));
        bool hasAny = ch.ChapterContent.Count > 0 || hasQuiz;
        return hasAny && contentDone && (!hasQuiz || quizPassed);
    }

    /// <summary>Kurs abgeschlossen: ≥1 relevantes Kapitel (mit Inhalt/Quiz) UND alle relevanten Kapitel abgeschlossen.</summary>
    public static bool IsCourseComplete(Course course, Progress? progress)
    {
        var completed = (progress?.CompletedChapterContentIds ?? new()).ToHashSet();
        var passed = (progress?.PassedChapterQuizIds ?? new()).ToHashSet();

        var relevant = course.Chapters
            .Where(ch => ch.ChapterContent.Count > 0 || !string.IsNullOrEmpty(ch.ChapterQuizId))
            .ToList();

        return relevant.Count > 0 && relevant.All(ch => IsChapterComplete(ch, completed, passed));
    }
}
