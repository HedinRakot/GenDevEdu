using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace DevEdu.Crm.Api.Models;

/// <summary>
/// Freitext-Aktivität zu einem Teilnehmer (Telefonnotiz, Gesprächsnotiz, …).
/// Eigene Collection, weil das Log unbegrenzt wächst und sortiert geladen wird.
/// </summary>
[BsonIgnoreExtraElements]
public class ActivityEntry
{
    public static readonly IReadOnlySet<string> AllowedKinds = new HashSet<string> { "note", "call", "email" };

    [BsonId]
    [BsonRepresentation(BsonType.String)]
    public string Id { get; set; } = Guid.NewGuid().ToString("N");

    public string ParticipantId { get; set; } = string.Empty;

    public string Text { get; set; } = string.Empty;

    /// <summary>note | call | email</summary>
    public string Kind { get; set; } = "note";

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
