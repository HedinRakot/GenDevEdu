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
    public List<string> CompletedTopicIds { get; set; } = new();
    public List<string> CompletedChapterIds { get; set; } = new();
    public List<ChapterQuizResult> ChapterQuizResults { get; set; } = new();
    public DateTime LastVisited { get; set; } = DateTime.UtcNow;
}

public class ChapterQuizResult
{
    public string ChapterId { get; set; } = string.Empty;
    public int EarnedPoints { get; set; }
    public int TotalPoints { get; set; }
    public int PassingThresholdPct { get; set; }
    public bool Passed { get; set; }
    public DateTime AttemptedAt { get; set; } = DateTime.UtcNow;
}

public class RefreshToken
{
    [BsonId]
    [BsonRepresentation(BsonType.String)]
    public string Id { get; set; } = Guid.NewGuid().ToString("N");

    public string Token { get; set; } = string.Empty;
    public string UserId { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public bool Revoked { get; set; }
}

public class Attempt
{
    [BsonId]
    [BsonRepresentation(BsonType.String)]
    public string Id { get; set; } = Guid.NewGuid().ToString("N");

    public string UserId { get; set; } = string.Empty;
    public string QuestionId { get; set; } = string.Empty;
    public string CourseId { get; set; } = string.Empty;
    public bool IsCorrect { get; set; }
    public int Score { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
