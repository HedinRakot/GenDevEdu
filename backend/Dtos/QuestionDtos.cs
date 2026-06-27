using DevEdu.Api.Models;

namespace DevEdu.Api.Dtos;

// ─── QuestionList-Antwort (GET /api/questionlists/{id}) ─────────────────────

public record QuestionListResponseModel(List<QuestionResponseDto> Questions);

public record QuestionResponseDto(
    string ElementId,
    string Name,
    Texte Titel,
    int QuestionType,
    List<AnswerResponseDto> Answers,
    string AnswerValue,
    CodeQuestionResponseDto? Code = null);

public record AnswerResponseDto(string Id, bool IsCorrect, Texte Titel, string Comment);

/// <summary>SolutionCode nur bei reveal (Autor/Admin); versteckte Testfälle ohne Input/Expected.</summary>
public record CodeQuestionResponseDto(
    int Language,
    string StarterCode,
    int TimeLimitMs,
    int MemoryLimitMb,
    List<CodeTestCasePreviewDto> TestCases,
    string? SolutionCode);

public record CodeTestCasePreviewDto(string Id, bool Hidden, string? Input, string? ExpectedOutput);

// ─── Attempt (POST /api/questions/{id}/attempt) ──────────────────────────────

/// <summary>
/// OneChoice   → AnswerId gesetzt
/// MultipleChoice → AnswerIds gesetzt
/// OwnAnswer   → TextAnswer gesetzt
/// </summary>
public record SubmitAttemptRequest(
    string? AnswerId,
    List<string>? AnswerIds,
    string? TextAnswer);

public record AttemptResultDto(bool IsCorrect, int Score, List<AnswerResponseDto> Answers);

// ─── Author-Create (POST /api/questionlists) ─────────────────────────────────

public record CreateQuestionListRequest(
    string? ChapterContentId,
    List<CreateQuestionRequest>? Questions);

public record CreateQuestionRequest(
    string? Name,
    List<TextItemDto>? TitelItems,
    int QuestionType,
    List<CreateAnswerRequest>? Answers,
    string? AnswerValue,
    CreateCodeQuestionRequest? Code = null);

public record CreateAnswerRequest(
    bool IsCorrect,
    List<TextItemDto>? TitelItems,
    string? Comment);

public record CreateCodeQuestionRequest(
    int Language,
    string? StarterCode,
    string? SolutionCode,
    List<CreateCodeTestCaseRequest>? TestCases,
    int? TimeLimitMs,
    int? MemoryLimitMb);

public record CreateCodeTestCaseRequest(string? Input, string? ExpectedOutput, bool Hidden);
