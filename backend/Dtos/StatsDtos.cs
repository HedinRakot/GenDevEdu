namespace DevEdu.Api.Dtos;

// ─── Lerner-Statistiken (F9, GET /api/me/stats) ──────────────────────────────

public record CourseStatDto(
    string CourseId,
    string CourseName,
    int ProgressPercent,
    int CompletedContent,
    int TotalContent,
    int ChaptersPassed,
    int TotalChapters,
    bool Completed);

public record LearnerStatsDto(
    int ActiveCourses,
    int CompletedCourses,
    int OverallProgressPercent,
    int CorrectAnswered,
    int TotalAnswered,
    int QuizAccuracyPercent,
    int ChapterQuizzesPassed,
    int ChapterQuizzesTaken,
    int CodeTasksSolved,
    int CodeTasksAttempted,
    List<CourseStatDto> Courses);
