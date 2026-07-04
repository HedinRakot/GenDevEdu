using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace DevEdu.Api.Models;

/// <summary>
/// Eine eingebettete Kurs-Passage (Lektion oder Frage) für RAG. Eigene Collection
/// "courseembeddings". <see cref="Id"/> ist deterministisch (courseId:sourceId:chunk),
/// <see cref="Hash"/> erlaubt inkrementelles Re-Embedding (nur Geändertes).
/// </summary>
[BsonIgnoreExtraElements]
public class CourseEmbedding
{
    [BsonId]
    [BsonRepresentation(BsonType.String)]
    public string Id { get; set; } = string.Empty;

    public string CourseId { get; set; } = string.Empty;
    public string ChapterId { get; set; } = string.Empty;
    public string SourceId { get; set; } = string.Empty;
    /// <summary>"lesson" oder "question".</summary>
    public string Kind { get; set; } = string.Empty;

    public string Title { get; set; } = string.Empty;
    public string Text { get; set; } = string.Empty;
    public string Hash { get; set; } = string.Empty;

    public double[] Vector { get; set; } = Array.Empty<double>();
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
