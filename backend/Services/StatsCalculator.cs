using DevEdu.Api.Dtos;
using DevEdu.Api.Models;

namespace DevEdu.Api.Services;

/// <summary>
/// Reine Aggregation der Lerner-Statistiken (kein DB-Zugriff ⇒ unit-testbar).
/// Der <see cref="StatsService"/> lädt die Daten und ruft <see cref="Build"/>.
/// </summary>
public static class StatsCalculator
{
    public static LearnerStatsDto Build(
        List<Course> enrolledCourses,
        List<Enrollment> enrollments,
        List<Progress> progressList,
        List<Attempt> attempts,
        List<ChapterQuizAttempt> quizAttempts,
        List<CodeSubmission> codeSubs)
    {
        var progressByCourse = progressList
            .GroupBy(p => p.CourseId)
            .ToDictionary(g => g.Key, g => g.First());
        var completedEnrollmentCourses = enrollments
            .Where(e => e.CompletedAt is not null)
            .Select(e => e.CourseId)
            .ToHashSet();

        var courseStats = new List<CourseStatDto>();
        foreach (var course in enrolledCourses)
        {
            // Echte Content-/Kapitel-IDs des Kurses (Schnittmenge schützt vor Altlasten).
            var contentIds = course.Chapters.SelectMany(ch => ch.ChapterContent.Select(cc => cc.ElementId)).ToHashSet();
            var quizChapterIds = course.Chapters
                .Where(ch => !string.IsNullOrEmpty(ch.ChapterQuizId))
                .Select(ch => ch.Id)
                .ToHashSet();

            progressByCourse.TryGetValue(course.Id, out var prog);
            int completedContent = prog?.CompletedChapterContentIds.Count(contentIds.Contains) ?? 0;
            int totalContent = contentIds.Count;
            int chaptersPassed = prog?.PassedChapterQuizIds.Count(quizChapterIds.Contains) ?? 0;
            int totalChapters = quizChapterIds.Count;

            bool completed = completedEnrollmentCourses.Contains(course.Id)
                || (totalContent > 0 && completedContent == totalContent && chaptersPassed == totalChapters);

            courseStats.Add(new CourseStatDto(
                course.Id,
                Mappers.PrimaryText(course.Titel),
                Grading.Percent(completedContent, totalContent),
                completedContent,
                totalContent,
                chaptersPassed,
                totalChapters,
                completed));
        }

        int sumCompleted = courseStats.Sum(c => c.CompletedContent);
        int sumTotal = courseStats.Sum(c => c.TotalContent);

        int correct = attempts.Count(a => a.IsCorrect);
        int chapterQuizzesPassed = quizAttempts.Where(a => a.Passed).Select(a => a.ChapterId).Distinct().Count();
        int chapterQuizzesTaken = quizAttempts.Select(a => a.ChapterId).Distinct().Count();
        int codeSolved = codeSubs.Where(s => s.Outcome == CodeRunOutcome.Passed).Select(s => s.QuestionId).Distinct().Count();
        int codeAttempted = codeSubs.Select(s => s.QuestionId).Distinct().Count();

        return new LearnerStatsDto(
            ActiveCourses: courseStats.Count(c => !c.Completed),
            CompletedCourses: courseStats.Count(c => c.Completed),
            OverallProgressPercent: Grading.Percent(sumCompleted, sumTotal),
            CorrectAnswered: correct,
            TotalAnswered: attempts.Count,
            QuizAccuracyPercent: Grading.Percent(correct, attempts.Count),
            ChapterQuizzesPassed: chapterQuizzesPassed,
            ChapterQuizzesTaken: chapterQuizzesTaken,
            CodeTasksSolved: codeSolved,
            CodeTasksAttempted: codeAttempted,
            Courses: courseStats);
    }
}
