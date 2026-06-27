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
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
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
