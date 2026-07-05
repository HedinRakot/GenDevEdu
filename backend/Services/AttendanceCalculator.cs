using System.Collections.Concurrent;
using DevEdu.Api.Models;
using TimeZoneConverter;

namespace DevEdu.Api.Services;

/// <summary>
/// F14: Pure Berechnungslogik des Anwesenheitsnachweises — keine DB, keine Uhr,
/// vollständig unit-testbar. Rohevents → Sitzungen → Tagesminuten → Status.
/// </summary>
public static class AttendanceCalculator
{
    /// <summary>
    /// Eine zusammenhängende Aktivitätsphase. EndUtc enthält bereits den
    /// Tail-Credit (letzter Heartbeat repräsentiert das folgende Intervall),
    /// sodass Dauer = EndUtc − StartUtc gilt.
    /// </summary>
    public record Session(DateTime StartUtc, DateTime EndUtc, string? CourseId, string? Screen)
    {
        public double Seconds => (EndUtc - StartUtc).TotalSeconds;
        public int Minutes => (int)Math.Round(Seconds / 60.0);
    }

    public record DayAggregate(
        DateOnly Date,
        int Minutes,
        DateTime? FirstActivityUtc,
        DateTime? LastActivityUtc,
        int SessionCount,
        int EventCount);

    private static readonly ConcurrentDictionary<string, TimeZoneInfo> TzCache = new();

    /// <summary>
    /// IANA-Zeitzone auflösen. TimeZoneConverter statt TimeZoneInfo.FindSystemTimeZoneById,
    /// weil das Projekt InvariantGlobalization=true setzt — damit schlägt die
    /// IANA→Windows-Auflösung auf Windows-Hosts (Dev/Tests) fehl.
    /// </summary>
    public static TimeZoneInfo GetTimeZone(string ianaId) =>
        TzCache.GetOrAdd(ianaId, TZConvert.GetTimeZoneInfo);

    public static DateOnly LocalDate(DateTime utc, TimeZoneInfo tz) =>
        DateOnly.FromDateTime(TimeZoneInfo.ConvertTimeFromUtc(DateTime.SpecifyKind(utc, DateTimeKind.Utc), tz));

    /// <summary>Beginn eines lokalen Tages als UTC-Instant.</summary>
    public static DateTime DayStartUtc(DateOnly localDate, TimeZoneInfo tz) =>
        TimeZoneInfo.ConvertTimeToUtc(
            DateTime.SpecifyKind(localDate.ToDateTime(TimeOnly.MinValue), DateTimeKind.Unspecified), tz);

    /// <summary>
    /// Events (beliebige Reihenfolge) → Sitzungen. Regeln:
    /// - Delta ≤ SessionGapMinutes → gleiche Sitzung; Logout schließt die Sitzung.
    /// - Tail-Credit: +HeartbeatIntervalSeconds nach dem letzten Event einer Sitzung
    ///   (sonst ergäben 60 Heartbeats à 60 s nur 59 min) — entfällt bei explizitem Logout.
    /// - Einzelnes Nicht-Logout-Event = Sitzung von genau HeartbeatIntervalSeconds.
    /// </summary>
    public static IReadOnlyList<Session> Sessionize(IEnumerable<AttendanceEvent> events, AttendanceOptions opt)
    {
        var ordered = events.OrderBy(e => e.OccurredAt).ToList();
        var sessions = new List<Session>();
        if (ordered.Count == 0) return sessions;

        var gap = TimeSpan.FromMinutes(opt.SessionGapMinutes);
        var tail = TimeSpan.FromSeconds(opt.HeartbeatIntervalSeconds);

        var current = new List<AttendanceEvent> { ordered[0] };
        for (var i = 1; i < ordered.Count; i++)
        {
            var prev = current[^1];
            var next = ordered[i];
            var closedByLogout = prev.Type == AttendanceEventType.Logout;
            if (closedByLogout || next.OccurredAt - prev.OccurredAt > gap)
            {
                sessions.Add(CloseSession(current, tail));
                current = new List<AttendanceEvent> { next };
            }
            else
            {
                current.Add(next);
            }
        }
        sessions.Add(CloseSession(current, tail));
        return sessions;
    }

    private static Session CloseSession(List<AttendanceEvent> events, TimeSpan tail)
    {
        var first = events[0];
        var last = events[^1];
        var end = last.Type == AttendanceEventType.Logout ? last.OccurredAt : last.OccurredAt + tail;

        string? Dominant(Func<AttendanceEvent, string?> select) => events
            .Select(select)
            .Where(v => !string.IsNullOrEmpty(v))
            .GroupBy(v => v)
            .OrderByDescending(g => g.Count())
            .FirstOrDefault()?.Key;

        return new Session(first.OccurredAt, end, Dominant(e => e.CourseId), Dominant(e => e.Screen));
    }

    /// <summary>
    /// Events → Tagesaggregate (lokale Tage in tz). Sitzungen, die lokale
    /// Mitternacht überqueren, werden gesplittet; Deltas rechnen immer auf
    /// UTC-Instants (dadurch DST-korrekt). First/Last/EventCount stammen aus
    /// den Events des jeweiligen lokalen Tages.
    /// </summary>
    public static Dictionary<DateOnly, DayAggregate> AggregateByDay(
        IEnumerable<AttendanceEvent> events, AttendanceOptions opt, TimeZoneInfo tz)
    {
        var list = events.ToList();
        var sessions = Sessionize(list, opt);

        var secondsByDay = new Dictionary<DateOnly, double>();
        var sessionsByDay = new Dictionary<DateOnly, int>();
        foreach (var session in sessions)
        {
            var cursor = session.StartUtc;
            var firstSegment = true;
            while (cursor < session.EndUtc || firstSegment)
            {
                var date = LocalDate(cursor, tz);
                var nextMidnightUtc = DayStartUtc(date.AddDays(1), tz);
                var segmentEnd = nextMidnightUtc < session.EndUtc ? nextMidnightUtc : session.EndUtc;

                secondsByDay[date] = secondsByDay.GetValueOrDefault(date) + (segmentEnd - cursor).TotalSeconds;
                sessionsByDay[date] = sessionsByDay.GetValueOrDefault(date) + 1;

                cursor = segmentEnd;
                firstSegment = false;
                if (segmentEnd >= session.EndUtc) break;
            }
        }

        var eventsByDay = list
            .GroupBy(e => LocalDate(e.OccurredAt, tz))
            .ToDictionary(g => g.Key, g => g.ToList());

        var allDays = secondsByDay.Keys.Union(eventsByDay.Keys);
        var result = new Dictionary<DateOnly, DayAggregate>();
        foreach (var date in allDays)
        {
            var dayEvents = eventsByDay.GetValueOrDefault(date);
            var minutes = (int)Math.Round(secondsByDay.GetValueOrDefault(date) / 60.0);
            minutes = Math.Min(minutes, 24 * 60); // defensiver Tages-Cap
            result[date] = new DayAggregate(
                date,
                minutes,
                dayEvents?.Min(e => e.OccurredAt),
                dayEvents?.Max(e => e.OccurredAt),
                sessionsByDay.GetValueOrDefault(date),
                dayEvents?.Count ?? 0);
        }
        return result;
    }

    /// <summary>
    /// Status eines Tages. Entschuldigung schlägt Minuten (belegte Abwesenheit
    /// gewinnt; Minuten bleiben in Anzeige/Export sichtbar).
    /// </summary>
    public static DayStatus DeriveStatus(DateOnly date, int minutes, TrainingPeriod? period, ExcusedAbsence? excuse)
    {
        if (period is null || date < period.StartDate || date > period.EndDate)
            return DayStatus.KeinSolltag;
        if (date.DayOfWeek is DayOfWeek.Saturday or DayOfWeek.Sunday)
            return DayStatus.KeinSolltag;
        if (excuse is not null)
            return DayStatus.Entschuldigt;
        if (minutes >= period.RequiredMinutesPerDay)
            return DayStatus.Anwesend;
        return minutes > 0 ? DayStatus.Teilweise : DayStatus.Fehlend;
    }

    // ── String-Mapping für DTOs/Exporte ─────────────────────────────────────
    // (Kein globaler JsonStringEnumConverter im Backend; Enums reisen als Strings.)

    public static string ToWire(DayStatus status) => status switch
    {
        DayStatus.Anwesend => "anwesend",
        DayStatus.Teilweise => "teilweise",
        DayStatus.Fehlend => "fehlend",
        DayStatus.Entschuldigt => "entschuldigt",
        _ => "keinSolltag",
    };

    public static string ToWire(ExcuseReason reason) => reason switch
    {
        ExcuseReason.Krank => "krank",
        ExcuseReason.Urlaub => "urlaub",
        ExcuseReason.Feiertag => "feiertag",
        _ => "sonstig",
    };

    public static bool TryParseReason(string? value, out ExcuseReason reason)
    {
        reason = value?.Trim().ToLowerInvariant() switch
        {
            "krank" => ExcuseReason.Krank,
            "urlaub" => ExcuseReason.Urlaub,
            "feiertag" => ExcuseReason.Feiertag,
            "sonstig" => ExcuseReason.Sonstig,
            _ => (ExcuseReason)(-1),
        };
        return (int)reason >= 0;
    }

    public static bool TryParseEventType(string? value, out AttendanceEventType type)
    {
        type = value?.Trim().ToLowerInvariant() switch
        {
            "login" => AttendanceEventType.Login,
            "logout" => AttendanceEventType.Logout,
            "heartbeat" => AttendanceEventType.Heartbeat,
            _ => (AttendanceEventType)(-1),
        };
        return (int)type >= 0;
    }

    public static string ToWire(AttendanceEventType type) => type switch
    {
        AttendanceEventType.Login => "login",
        AttendanceEventType.Logout => "logout",
        _ => "heartbeat",
    };

    // ── Deutsche Namen (hart codiert — InvariantGlobalization formatiert Englisch) ──

    private static readonly string[] WeekdaysShort = { "So", "Mo", "Di", "Mi", "Do", "Fr", "Sa" };
    private static readonly string[] Months =
    {
        "Januar", "Februar", "März", "April", "Mai", "Juni",
        "Juli", "August", "September", "Oktober", "November", "Dezember",
    };

    public static string GermanWeekday(DateOnly date) => WeekdaysShort[(int)date.DayOfWeek];
    public static string GermanMonth(int month) => Months[month - 1];

    public static string GermanStatus(DayStatus status) => status switch
    {
        DayStatus.Anwesend => "Anwesend",
        DayStatus.Teilweise => "Teilweise",
        DayStatus.Fehlend => "Fehlend",
        DayStatus.Entschuldigt => "Entschuldigt",
        _ => "Kein Solltag",
    };

    public static string GermanReason(ExcuseReason reason) => reason switch
    {
        ExcuseReason.Krank => "Krank",
        ExcuseReason.Urlaub => "Urlaub",
        ExcuseReason.Feiertag => "Feiertag",
        _ => "Sonstig",
    };
}
