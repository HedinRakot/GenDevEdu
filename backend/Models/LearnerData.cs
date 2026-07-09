using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace DevEdu.Api.Models;

public class Enrollment
{
    [BsonId]
    [BsonRepresentation(BsonType.String)]
    public string Id { get; set; } = Guid.NewGuid().ToString("N");

    public string UserId { get; set; } = string.Empty;
    public string CourseId { get; set; } = string.Empty;
    public string Status { get; set; } = "Active";
    public DateTime StartedAt { get; set; } = DateTime.UtcNow;
    public DateTime? CompletedAt { get; set; }
}

public class Progress
{
    [BsonId]
    [BsonRepresentation(BsonType.String)]
    public string Id { get; set; } = Guid.NewGuid().ToString("N");

    public string UserId { get; set; } = string.Empty;
    public string CourseId { get; set; } = string.Empty;
    public List<string> CompletedChapterContentIds { get; set; } = new();
    /// <summary>Kapitel-IDs, deren Abschlussquiz bestanden wurde (F8, Basis für F10).</summary>
    public List<string> PassedChapterQuizIds { get; set; } = new();
    public DateTime LastVisited { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Abschluss-Zeitstempel je Content-Element (Basis für das Teilnehmer-Dashboard:
    /// Abgleich "abgeschlossen geklickt" vs. tatsächliche Lernzeit aus F14).
    /// Wird parallel zu <see cref="CompletedChapterContentIds"/> gepflegt
    /// (Doppelschreibung, abwärtskompatibel — Altbestand hat hier keine Einträge).
    /// </summary>
    public List<ContentCompletion> ContentCompletions { get; set; } = new();
}

/// <summary>Ein einzelner Content-Abschluss mit Zeitpunkt.</summary>
public class ContentCompletion
{
    public string ContentId { get; set; } = string.Empty;
    public DateTime CompletedAtUtc { get; set; } = DateTime.UtcNow;
}

public class Attempt
{
    [BsonId]
    [BsonRepresentation(BsonType.String)]
    public string Id { get; set; } = Guid.NewGuid().ToString("N");

    public string UserId { get; set; } = string.Empty;
    /// <summary>ID der Question innerhalb einer QuestionList.</summary>
    public string QuestionId { get; set; } = string.Empty;
    public string CourseId { get; set; } = string.Empty;
    public bool IsCorrect { get; set; }
    public int Score { get; set; }

    /// <summary>
    /// Vom Lerner gewählte Antwort-IDs (OneChoice: genau eine; MultipleChoice: mehrere).
    /// Ermöglicht Falsch-Antwort-Analyse im Teilnehmer-Dashboard.
    /// Altbestand vor Juli 2026 hat hier keine Einträge.
    /// </summary>
    public List<string> SelectedAnswerIds { get; set; } = new();

    /// <summary>Eingereichter Freitext bei OwnAnswer-Fragen (sonst null).</summary>
    public string? SubmittedText { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

/// <summary>Zertifikat für einen abgeschlossenen Kurs (F10). Namen sind Snapshots.</summary>
public class Certificate
{
    [BsonId]
    [BsonRepresentation(BsonType.String)]
    public string Id { get; set; } = Guid.NewGuid().ToString("N");

    public string UserId { get; set; } = string.Empty;
    public string CourseId { get; set; } = string.Empty;
    public string CourseName { get; set; } = string.Empty;     // Snapshot bei Ausstellung
    public string LearnerName { get; set; } = string.Empty;    // Snapshot bei Ausstellung
    public string VerificationCode { get; set; } = string.Empty;
    public DateTime IssuedAt { get; set; } = DateTime.UtcNow;
}

/// <summary>Ein vollständiger Versuch eines Kapitel-Abschlussquiz (F8).</summary>
public class ChapterQuizAttempt
{
    [BsonId]
    [BsonRepresentation(BsonType.String)]
    public string Id { get; set; } = Guid.NewGuid().ToString("N");

    public string UserId { get; set; } = string.Empty;
    public string CourseId { get; set; } = string.Empty;
    public string ChapterId { get; set; } = string.Empty;
    public string QuestionListId { get; set; } = string.Empty;
    public int AttemptNo { get; set; }
    public int CorrectCount { get; set; }
    public int TotalCount { get; set; }
    public int Percent { get; set; }
    public bool Passed { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
