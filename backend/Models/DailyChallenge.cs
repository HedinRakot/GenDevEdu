using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace DevEdu.Api.Models;

/// <summary>
/// Tägliche Mini-Coding-Challenge (server-verwaltet; früher hartcodiert im
/// Frontend). Die Tagesauswahl trifft <c>DailyChallengeService</c> deterministisch
/// über alle aktiven Challenges — alle Nutzer sehen am selben Tag dieselbe.
/// Difficulty/Category bewusst als Strings (lesbar in der DB, kein Enum-Mapping).
/// </summary>
[BsonIgnoreExtraElements]
public class DailyChallenge
{
    /// <summary>Sprechender Slug als Id (z.B. "cs-datentypen").</summary>
    [BsonId]
    [BsonRepresentation(BsonType.String)]
    public string Id { get; set; } = Guid.NewGuid().ToString("N");

    public Texte Title { get; set; } = new();
    public Texte Description { get; set; } = new();

    /// <summary>Sprachunabhängiger Hinweis-/Beispiel-Code (optional).</summary>
    public string? ExampleSnippet { get; set; }
    public string SnippetLang { get; set; } = "csharp";

    public int EstimatedMinutes { get; set; }
    /// <summary>easy | medium | hard</summary>
    public string Difficulty { get; set; } = "easy";
    /// <summary>Kategorie ~ Kurskapitel (types, loops, linq, …).</summary>
    public string Category { get; set; } = "general";

    /// <summary>Inaktive Challenges nehmen nicht an der Tagesauswahl teil.</summary>
    public bool Active { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
