namespace DevEdu.Api.Dtos;

// ─── Teilnehmer-Dashboard (GET /api/admin/learners…) ─────────────────────────

/// <summary>Zeile der Teilnehmerliste (Aggregat über alle Kurse).</summary>
public record AdminLearnerSummaryDto(
    string UserId,
    string DisplayName,
    string Email,
    string Role,
    /// <summary>Letzte Aktivität innerhalb der letzten 7 Tage.</summary>
    bool Active,
    DateTime? LastActivityUtc,
    /// <summary>Sessionisierte Minuten aus F14 (Summe aller Tage).</summary>
    int TotalLearningMinutes,
    int OverallProgressPercent,
    int QuizAccuracyPercent,
    int TotalAnswered,
    int ActiveCourses,
    int CompletedCourses);

/// <summary>Getrackte Lernzeit je Kurs (~Minuten, aus 60-s-Heartbeats gezählt).</summary>
public record CourseTimeDto(string CourseId, string CourseName, int Minutes, List<ChapterTimeDto> Chapters);
public record ChapterTimeDto(string ChapterId, string ChapterName, int Minutes);

/// <summary>Einzelner Fragen-Versuch inkl. gewählter Antworten (Falsch-Antwort-Analyse).</summary>
public record AttemptHistoryDto(
    string QuestionId,
    /// <summary>null = Frage existiert nicht mehr (Quiz wurde ersetzt).</summary>
    string? QuestionText,
    string CourseId,
    string? CourseName,
    bool IsCorrect,
    List<string> SelectedAnswers,
    string? SubmittedText,
    DateTime CreatedAt);

public record CodeSubmissionSummaryDto(
    string QuestionId,
    string Status,
    string Outcome,
    int PassedCount,
    int TotalCount,
    DateTime CreatedAt);

/// <summary>
/// Engagement je Kapitel: Abschluss-Klicks vs. tatsächlich getrackte Minuten —
/// beantwortet "wirklich bearbeitet oder nur auf abgeschlossen geklickt?".
/// </summary>
public record ChapterEngagementDto(
    string CourseId,
    string ChapterId,
    string ChapterName,
    int CompletedContentCount,
    int TotalContentCount,
    bool QuizPassed,
    /// <summary>~Minuten mit Heartbeats in diesem Kapitel (0 = nie aktiv getrackt).</summary>
    int MinutesTracked,
    DateTime? LastCompletionUtc);

public record AdminLearnerDetailDto(
    string UserId,
    string DisplayName,
    string Email,
    DateTime? LastActivityUtc,
    int TotalLearningMinutes,
    LearnerStatsDto Stats,
    List<CourseTimeDto> CourseTimes,
    List<ChapterEngagementDto> Engagement,
    List<AttemptHistoryDto> RecentAttempts,
    List<CodeSubmissionSummaryDto> RecentCodeSubmissions);
