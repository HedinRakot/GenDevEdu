namespace DevEdu.Api.Services;

/// <summary>F14: Konfiguration des Anwesenheitsnachweises (Section "Attendance").</summary>
public class AttendanceOptions
{
    /// <summary>Erwarteter Heartbeat-Takt der App; zugleich Tail-Credit pro Sitzung.</summary>
    public int HeartbeatIntervalSeconds { get; set; } = 60;

    /// <summary>Lücke zwischen zwei Events, ab der eine neue Sitzung beginnt.</summary>
    public int SessionGapMinutes { get; set; } = 5;

    /// <summary>Default-Sollzeit pro Tag für neue Maßnahmezeiträume.</summary>
    public int DefaultRequiredMinutesPerDay { get; set; } = 240;

    /// <summary>IANA-Zeitzone für Tages-Bucketing (Speicherung bleibt UTC).</summary>
    public string TimeZone { get; set; } = "Europe/Berlin";

    /// <summary>Wie weit in der Vergangenheit offline gepufferte Events akzeptiert werden.</summary>
    public int MaxOfflineBufferHours { get; set; } = 48;

    public int MaxBatchSize { get; set; } = 500;

    /// <summary>Bildungsträger-Name im PDF-Kopf.</summary>
    public string OperatorName { get; set; } = "Developer Education";
}
