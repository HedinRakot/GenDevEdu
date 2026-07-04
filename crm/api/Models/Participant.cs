using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace DevEdu.Crm.Api.Models;

/// <summary>
/// Pipeline-Phasen eines Teilnehmers. Wird in BSON und JSON immer als String
/// gespeichert/übertragen — eine Umsortierung des Enums darf die Daten nicht brechen.
/// </summary>
public enum PipelinePhase
{
    Erstgespraech,
    Eignungstest,
    GutscheinBeantragt,
    GutscheinGenehmigt,
    AusbildungGestartet,
    // Terminalzustände
    Abgebrochen,
    Abgelehnt,
}

[BsonIgnoreExtraElements]
public class Participant
{
    [BsonId]
    [BsonRepresentation(BsonType.String)]
    public string Id { get; set; } = Guid.NewGuid().ToString("N");

    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;

    /// <summary>Date-only-Semantik (UTC-Mitternacht); Uhrzeit wird ignoriert.</summary>
    public DateTime? BirthDate { get; set; }

    public string Street { get; set; } = string.Empty;
    public string PostalCode { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;

    public AgenturInfo Agentur { get; set; } = new();
    public BildungsgutscheinInfo Gutschein { get; set; } = new();

    [BsonRepresentation(BsonType.String)]
    public PipelinePhase Phase { get; set; } = PipelinePhase.Erstgespraech;

    /// <summary>Vollständige Phasen-Historie inkl. Initialphase (ältester Eintrag zuerst).</summary>
    public List<StatusHistoryEntry> StatusHistory { get; set; } = new();

    /// <summary>Geplanter Kursstart (Platzhalter der Willkommens-E-Mail).</summary>
    public DateTime? CourseStart { get; set; }

    public string Notes { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

[BsonIgnoreExtraElements]
public class AgenturInfo
{
    public string Kundennummer { get; set; } = string.Empty;
    public string VermittlerName { get; set; } = string.Empty;
    public string VermittlerEmail { get; set; } = string.Empty;
    public string VermittlerPhone { get; set; } = string.Empty;
    public string Dienststelle { get; set; } = string.Empty;
}

[BsonIgnoreExtraElements]
public class BildungsgutscheinInfo
{
    public string Nummer { get; set; } = string.Empty;
    public DateTime? GueltigBis { get; set; }
}

[BsonIgnoreExtraElements]
public class StatusHistoryEntry
{
    [BsonRepresentation(BsonType.String)]
    public PipelinePhase Phase { get; set; }

    public string? Note { get; set; }

    public DateTime ChangedAt { get; set; } = DateTime.UtcNow;
}
