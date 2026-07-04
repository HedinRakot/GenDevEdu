using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace DevEdu.Crm.Api.Models;

/// <summary>
/// Bearbeitbare E-Mail-Vorlage mit {{platzhalter}}-Syntax. Identifiziert über
/// den fachlichen Key (v1: nur "welcome"), der unique indiziert ist.
/// </summary>
[BsonIgnoreExtraElements]
public class EmailTemplate
{
    public const string WelcomeKey = "welcome";

    [BsonId]
    [BsonRepresentation(BsonType.String)]
    public string Id { get; set; } = Guid.NewGuid().ToString("N");

    public string Key { get; set; } = WelcomeKey;

    public string Subject { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
