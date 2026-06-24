using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace DevEdu.Api.Models;

/// <summary>
/// Stored in its own `questions` collection. References the owning course and
/// either a topic (scope=Topic) or a chapter (scope=Chapter).
/// A single flat document holds the type-specific fields; unused ones stay null/empty.
/// </summary>
public class Question
{
    [BsonId]
    [BsonRepresentation(BsonType.String)]
    public string Id { get; set; } = Guid.NewGuid().ToString("N");

    public string CourseId { get; set; } = string.Empty;
    public string? TopicId { get; set; }
    public string? ChapterId { get; set; }

    /// <summary>"Topic" | "Chapter"</summary>
    public string Scope { get; set; } = QuestionScope.Topic;

    /// <summary>"SingleChoice" | "MultipleChoice" | "TrueFalse"</summary>
    public string Type { get; set; } = QuestionType.SingleChoice;

    public string Prompt { get; set; } = string.Empty;
    public string? Explanation { get; set; }
    public int Points { get; set; } = 1;
    public string Difficulty { get; set; } = "Easy";

    // Choice options (SingleChoice / MultipleChoice)
    public List<QuestionOption> Options { get; set; } = new();

    // Correct-answer fields (author-only; stripped from learner DTOs)
    public string? CorrectOptionId { get; set; }
    public List<string> CorrectOptionIds { get; set; } = new();
    public bool? CorrectAnswer { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class QuestionOption
{
    public string Id { get; set; } = Guid.NewGuid().ToString("N");
    public string Text { get; set; } = string.Empty;
}
