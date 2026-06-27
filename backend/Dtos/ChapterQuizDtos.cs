namespace DevEdu.Api.Dtos;

// ─── Autor: Quiz setzen/ersetzen (PUT /api/chapters/{id}/quiz) ────────────────

public record SetChapterQuizRequest(
    List<CreateQuestionRequest>? Questions,
    int? PassThresholdPercent,
    int? MaxAttempts);

// ─── Quiz abrufen (GET /api/chapters/{id}/quiz) ──────────────────────────────

/// <summary>
/// Lerner-Sicht: Fragen ohne Antworten (revealAnswers=false) + eigener Versuchsstatus.
/// Autor/Admin-Sicht: Fragen mit Antworten.
/// </summary>
public record ChapterQuizDto(
    string ChapterId,
    int PassThresholdPercent,
    int MaxAttempts,
    List<QuestionResponseDto> Questions,
    int AttemptsUsed,
    int? BestPercent,
    bool Passed,
    bool AttemptsExhausted);

// ─── Abgabe (POST /api/chapters/{id}/quiz/attempt) ───────────────────────────

public record ChapterQuizAnswerDto(string QuestionId, string? AnswerId, List<string>? AnswerIds);

public record SubmitChapterQuizRequest(List<ChapterQuizAnswerDto>? Answers);

public record ChapterQuizResultDto(
    int CorrectCount,
    int TotalCount,
    int Percent,
    bool Passed,
    int AttemptNo,
    int MaxAttempts,
    int AttemptsRemaining,
    List<QuestionResponseDto> Questions);
