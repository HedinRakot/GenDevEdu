using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace DevEdu.Api.Models;

public enum CodeSubmissionStatus { Queued = 0, Running = 1, Completed = 2, Error = 3 }

public enum CodeRunOutcome
{
    Pending = 0,
    Passed = 1,
    Failed = 2,
    CompileError = 3,
    RuntimeError = 4,
    TimeLimit = 5,
    MemoryLimit = 6,
    InternalError = 7,
}

/// <summary>Eigene MongoDB-Collection "codesubmissions". Append-only, wie Attempt.</summary>
public class CodeSubmission
{
    [BsonId]
    [BsonRepresentation(BsonType.String)]
    public string Id { get; set; } = Guid.NewGuid().ToString("N");

    public string UserId { get; set; } = string.Empty;
    public string QuestionId { get; set; } = string.Empty;
    public string CourseId { get; set; } = string.Empty;

    public CodeLanguage Language { get; set; } = CodeLanguage.CSharp;
    public string SubmittedCode { get; set; } = string.Empty;

    public CodeSubmissionStatus Status { get; set; } = CodeSubmissionStatus.Queued;
    public CodeRunOutcome Outcome { get; set; } = CodeRunOutcome.Pending;

    /// <summary>Compile-Fehler des Lerner-Codes – darf dem Lerner gezeigt werden.</summary>
    public string? CompileError { get; set; }

    /// <summary>Nur generische Infrastruktur-/Interne-Meldung (keine Details leaken).</summary>
    public string? ErrorMessage { get; set; }

    public List<CodeTestCaseResult> TestResults { get; set; } = new();
    public int PassedCount { get; set; }
    public int TotalCount { get; set; }
    public long DurationMs { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? StartedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
}

public class CodeTestCaseResult
{
    public string TestCaseId { get; set; } = string.Empty;
    public bool Hidden { get; set; }
    public bool Passed { get; set; }
    public CodeRunOutcome Outcome { get; set; } = CodeRunOutcome.Pending;
    public long DurationMs { get; set; }

    /// <summary>Bei Hidden-Testfällen für Lerner im Mapper genullt.</summary>
    public string? Input { get; set; }
    public string? ExpectedOutput { get; set; }
    public string? ActualOutput { get; set; }
    public string? Stderr { get; set; }
}
