namespace DevEdu.Api.Dtos;

// ─── Einreichung (POST /api/code-submissions) ────────────────────────────────

public record SubmitCodeRequest(string? QuestionId, string? Code);

/// <summary>202-Antwort: Submission wurde angenommen und eingereiht.</summary>
public record CodeSubmissionAcceptedDto(string Id, string Status);

// ─── Ergebnis (GET /api/code-submissions/{id}) ───────────────────────────────

public record CodeSubmissionResultDto(
    string Id,
    string QuestionId,
    string Status,
    string Outcome,
    int PassedCount,
    int TotalCount,
    long DurationMs,
    string? CompileError,
    string? ErrorMessage,
    List<CodeTestCaseResultDto> TestResults);

/// <summary>
/// Für versteckte Testfälle werden Input/ExpectedOutput/ActualOutput/Stderr in
/// der Lerner-Sicht genullt (siehe Mappers); Passed/Outcome/DurationMs bleiben.
/// </summary>
public record CodeTestCaseResultDto(
    string TestCaseId,
    bool Hidden,
    bool Passed,
    string Outcome,
    long DurationMs,
    string? Input,
    string? ExpectedOutput,
    string? ActualOutput,
    string? Stderr);
