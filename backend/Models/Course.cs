using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace DevEdu.Api.Models;

public class Course
{
    [BsonId]
    [BsonRepresentation(BsonType.String)]
    public string Id { get; set; } = Guid.NewGuid().ToString("N");

    public string Title { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public List<string> Tags { get; set; } = new();
    public string Level { get; set; } = string.Empty;
    public string Status { get; set; } = CourseStatus.Draft;
    public string AuthorId { get; set; } = string.Empty;

    public List<Chapter> Chapters { get; set; } = new();

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

public class Chapter
{
    public string Id { get; set; } = Guid.NewGuid().ToString("N");
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int Order { get; set; }
    public List<Topic> Topics { get; set; } = new();
}

public class Topic
{
    public string Id { get; set; } = Guid.NewGuid().ToString("N");
    public string Title { get; set; } = string.Empty;
    public int Order { get; set; }
    public List<Example> Examples { get; set; } = new();
}

public class Example
{
    public string Id { get; set; } = Guid.NewGuid().ToString("N");
    public string Title { get; set; } = string.Empty;
    public List<ContentBlock> ContentBlocks { get; set; } = new();
    public string? Language { get; set; }
    public int Order { get; set; }
}

public class ContentBlock
{
    /// <summary>"markdown" | "code"</summary>
    public string Kind { get; set; } = "markdown";
    public string Text { get; set; } = string.Empty;
    public string? Language { get; set; }
}
