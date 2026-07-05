using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace DevEdu.Api.Models;

// ─── F14: AZAV-Anwesenheits-/Aktivitätsnachweis ─────────────────────────────
// Rohe AttendanceEvents sind das rechtlich relevante Beweismaterial und werden
// append-only gespeichert (keine TTL — Aufbewahrungspflicht). Alles Abgeleitete
// (Sitzungen, Minuten, Status) wird aus ihnen berechnet.

public enum AttendanceEventType { Login, Logout, Heartbeat }

public class AttendanceEvent
{
    [BsonId]
    [BsonRepresentation(BsonType.String)]
    public string Id { get; set; } = Guid.NewGuid().ToString("N");

    /// <summary>Clerk user ID — stammt IMMER aus dem Token, nie aus dem Request-Body.</summary>
    public string UserId { get; set; } = string.Empty;

    /// <summary>Client-generierte UUID; unique pro User → idempotente Retries.</summary>
    public string ClientEventId { get; set; } = string.Empty;

    [BsonRepresentation(BsonType.String)]
    public AttendanceEventType Type { get; set; }

    /// <summary>Client-Zeitstempel (UTC), beim Ingest auf ≤ ReceivedAt geclampt.</summary>
    public DateTime OccurredAt { get; set; }

    /// <summary>Server-Zeitstempel (UTC) — autoritativ gegen manipulierte Client-Uhren.</summary>
    public DateTime ReceivedAt { get; set; } = DateTime.UtcNow;

    public string? CourseId { get; set; }
    public string? ChapterId { get; set; }
    public string? Screen { get; set; }
    /// <summary>ios | android | web</summary>
    public string? Platform { get; set; }
}

/// <summary>Maßnahmezeitraum eines Teilnehmers (Solltage = Mo–Fr innerhalb des Zeitraums).</summary>
public class TrainingPeriod
{
    [BsonId]
    [BsonRepresentation(BsonType.String)]
    public string Id { get; set; } = Guid.NewGuid().ToString("N");

    public string UserId { get; set; } = string.Empty;
    /// <summary>Lokales Datum (Europe/Berlin), inklusiv.</summary>
    public DateOnly StartDate { get; set; }
    /// <summary>Lokales Datum (Europe/Berlin), inklusiv.</summary>
    public DateOnly EndDate { get; set; }
    public int RequiredMinutesPerDay { get; set; }
    /// <summary>z. B. "Umschulung FIAE 2026".</summary>
    public string? Label { get; set; }
    public string CreatedBy { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public enum ExcuseReason { Krank, Urlaub, Feiertag, Sonstig }

/// <summary>Entschuldigter Tag; genau ein Dokument pro (User, Tag) — unique Index.</summary>
public class ExcusedAbsence
{
    [BsonId]
    [BsonRepresentation(BsonType.String)]
    public string Id { get; set; } = Guid.NewGuid().ToString("N");

    public string UserId { get; set; } = string.Empty;
    /// <summary>Lokales Datum (Europe/Berlin).</summary>
    public DateOnly Date { get; set; }

    [BsonRepresentation(BsonType.String)]
    public ExcuseReason Reason { get; set; }

    public string? Note { get; set; }
    public string CreatedBy { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public enum DayStatus { Anwesend, Teilweise, Fehlend, Entschuldigt, KeinSolltag }

/// <summary>
/// Materialisiertes Tagesaggregat — wird beim Event-Ingest pro berührtem
/// (User, lokalem Tag) aus den Rohevents neu berechnet. Der Status wird bewusst
/// NICHT gespeichert, sondern beim Lesen aus (Minuten, TrainingPeriod,
/// ExcusedAbsence) abgeleitet — Entschuldigungen/Zeiträume ändern erfordert
/// so nie einen Recompute.
/// </summary>
public class DailyAttendance
{
    /// <summary>Deterministisch "{UserId}:{yyyy-MM-dd}" → idempotente Upserts.</summary>
    [BsonId]
    public string Id { get; set; } = string.Empty;

    public string UserId { get; set; } = string.Empty;
    /// <summary>Lokales Datum (Europe/Berlin).</summary>
    public DateOnly Date { get; set; }

    /// <summary>Sessionisierte aktive Minuten des Tages.</summary>
    public int Minutes { get; set; }
    public DateTime? FirstActivityUtc { get; set; }
    public DateTime? LastActivityUtc { get; set; }
    public int SessionCount { get; set; }
    public int EventCount { get; set; }
    public DateTime ComputedAt { get; set; } = DateTime.UtcNow;

    public static string MakeId(string userId, DateOnly date) =>
        $"{userId}:{date:yyyy-MM-dd}";
}
