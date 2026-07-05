using System.Globalization;
using System.Text;
using DevEdu.Api.Models;
using MongoDB.Driver;

namespace DevEdu.Api.Services;

/// <summary>
/// F14: CSV-Exporte (RFC 4180: Komma-getrennt, Quoting bei Bedarf).
/// UTF-8 mit BOM, damit Excel Umlaute korrekt erkennt.
/// </summary>
public class AttendanceExportService
{
    private readonly MongoContext _db;
    private readonly AttendanceOptions _opt;

    public AttendanceExportService(MongoContext db, AttendanceOptions opt)
    {
        _db = db;
        _opt = opt;
    }

    private TimeZoneInfo Tz => AttendanceCalculator.GetTimeZone(_opt.TimeZone);

    /// <summary>Rohevents — das lückenlose Beweismaterial.</summary>
    public async Task<ServiceResult<byte[]>> ExportEventsCsvAsync(string? userId, DateOnly? from, DateOnly? to)
    {
        var range = NormalizeRange(from, to);
        if (!range.IsOk) return range.As<byte[]>();
        var (fromDate, toDate) = range.Value!.Value;

        var windowStart = AttendanceCalculator.DayStartUtc(fromDate, Tz);
        var windowEnd = AttendanceCalculator.DayStartUtc(toDate.AddDays(1), Tz);

        var filter = Builders<AttendanceEvent>.Filter.Gte(e => e.OccurredAt, windowStart)
                     & Builders<AttendanceEvent>.Filter.Lt(e => e.OccurredAt, windowEnd);
        if (!string.IsNullOrWhiteSpace(userId))
            filter &= Builders<AttendanceEvent>.Filter.Eq(e => e.UserId, userId);

        var names = await LoadDisplayNamesAsync(userId);

        var sb = new StringBuilder();
        WriteRow(sb, "userId", "name", "typ", "zeitpunktUtc", "zeitpunktBerlin", "empfangenUtc",
            "kursId", "kapitelId", "screen", "plattform", "clientEventId");

        using var cursor = await _db.AttendanceEvents
            .Find(filter)
            .SortBy(e => e.UserId).ThenBy(e => e.OccurredAt)
            .ToCursorAsync();
        while (await cursor.MoveNextAsync())
        {
            foreach (var e in cursor.Current)
            {
                WriteRow(sb,
                    e.UserId,
                    names.GetValueOrDefault(e.UserId, string.Empty),
                    AttendanceCalculator.ToWire(e.Type),
                    e.OccurredAt.ToString("yyyy-MM-dd HH:mm:ss", CultureInfo.InvariantCulture),
                    ToBerlin(e.OccurredAt),
                    e.ReceivedAt.ToString("yyyy-MM-dd HH:mm:ss", CultureInfo.InvariantCulture),
                    e.CourseId ?? string.Empty,
                    e.ChapterId ?? string.Empty,
                    e.Screen ?? string.Empty,
                    e.Platform ?? string.Empty,
                    e.ClientEventId);
            }
        }
        return ServiceResult<byte[]>.Ok(WithBom(sb.ToString()));
    }

    /// <summary>Tagesübersicht mit abgeleitetem Status — pro Lerner mit Maßnahmezeitraum.</summary>
    public async Task<ServiceResult<byte[]>> ExportDailyCsvAsync(string? userId, DateOnly? from, DateOnly? to)
    {
        var range = NormalizeRange(from, to);
        if (!range.IsOk) return range.As<byte[]>();
        var (fromDate, toDate) = range.Value!.Value;

        var periodFilter = Builders<TrainingPeriod>.Filter.Lte(p => p.StartDate, toDate)
                           & Builders<TrainingPeriod>.Filter.Gte(p => p.EndDate, fromDate);
        if (!string.IsNullOrWhiteSpace(userId))
            periodFilter &= Builders<TrainingPeriod>.Filter.Eq(p => p.UserId, userId);
        var periods = await _db.TrainingPeriods.Find(periodFilter).ToListAsync();

        var userIds = string.IsNullOrWhiteSpace(userId)
            ? periods.Select(p => p.UserId).Distinct().ToList()
            : new List<string> { userId };

        var users = await _db.Users.Find(u => userIds.Contains(u.ClerkUserId)).ToListAsync();
        var aggregates = await _db.DailyAttendance
            .Find(d => userIds.Contains(d.UserId) && d.Date >= fromDate && d.Date <= toDate)
            .ToListAsync();
        var excuses = await _db.ExcusedAbsences
            .Find(e => userIds.Contains(e.UserId) && e.Date >= fromDate && e.Date <= toDate)
            .ToListAsync();

        var userByClerkId = users.ToDictionary(u => u.ClerkUserId);
        var aggsByUser = aggregates.GroupBy(a => a.UserId)
            .ToDictionary(g => g.Key, g => g.ToDictionary(a => a.Date));
        var excusesByUser = excuses.GroupBy(e => e.UserId)
            .ToDictionary(g => g.Key, g => g.ToDictionary(e => e.Date));

        var sb = new StringBuilder();
        WriteRow(sb, "userId", "name", "email", "datum", "wochentag", "minuten", "sollMinuten",
            "status", "entschuldigung", "bemerkung", "ersteAktivitaetBerlin", "letzteAktivitaetBerlin", "sitzungen");

        foreach (var uid in userIds.OrderBy(u => u))
        {
            var user = userByClerkId.GetValueOrDefault(uid);
            var userPeriods = periods.Where(p => p.UserId == uid).ToList();
            var userAggs = aggsByUser.GetValueOrDefault(uid) ?? new Dictionary<DateOnly, DailyAttendance>();
            var userExcuses = excusesByUser.GetValueOrDefault(uid) ?? new Dictionary<DateOnly, ExcusedAbsence>();

            foreach (var date in AttendanceService.EnumerateDays(fromDate, toDate))
            {
                var agg = userAggs.GetValueOrDefault(date);
                var excuse = userExcuses.GetValueOrDefault(date);
                var period = AttendanceService.PeriodFor(userPeriods, date);
                var status = AttendanceCalculator.DeriveStatus(date, agg?.Minutes ?? 0, period, excuse);

                WriteRow(sb,
                    uid,
                    AttendanceService.DisplayName(user, uid),
                    user?.Email ?? string.Empty,
                    date.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
                    AttendanceCalculator.GermanWeekday(date),
                    (agg?.Minutes ?? 0).ToString(CultureInfo.InvariantCulture),
                    (period?.RequiredMinutesPerDay ?? 0).ToString(CultureInfo.InvariantCulture),
                    AttendanceCalculator.GermanStatus(status),
                    excuse is null ? string.Empty : AttendanceCalculator.GermanReason(excuse.Reason),
                    excuse?.Note ?? string.Empty,
                    agg?.FirstActivityUtc is { } f ? ToBerlin(f) : string.Empty,
                    agg?.LastActivityUtc is { } l ? ToBerlin(l) : string.Empty,
                    (agg?.SessionCount ?? 0).ToString(CultureInfo.InvariantCulture));
            }
        }
        return ServiceResult<byte[]>.Ok(WithBom(sb.ToString()));
    }

    // ── Helfer ───────────────────────────────────────────────────────────────

    private ServiceResult<(DateOnly From, DateOnly To)?> NormalizeRange(DateOnly? from, DateOnly? to)
    {
        var today = AttendanceCalculator.LocalDate(DateTime.UtcNow, Tz);
        var fromDate = from ?? new DateOnly(today.Year, today.Month, 1);
        var toDate = to ?? today;
        if (fromDate > toDate)
            return ServiceResult<(DateOnly, DateOnly)?>.Validation("from muss vor to liegen.");
        if (toDate.DayNumber - fromDate.DayNumber > 400)
            return ServiceResult<(DateOnly, DateOnly)?>.Validation("Maximal 400 Tage pro Export.");
        return ServiceResult<(DateOnly, DateOnly)?>.Ok((fromDate, toDate));
    }

    private async Task<Dictionary<string, string>> LoadDisplayNamesAsync(string? userId)
    {
        var filter = string.IsNullOrWhiteSpace(userId)
            ? Builders<User>.Filter.Empty
            : Builders<User>.Filter.Eq(u => u.ClerkUserId, userId);
        var users = await _db.Users.Find(filter).ToListAsync();
        return users
            .Where(u => !string.IsNullOrEmpty(u.ClerkUserId))
            .ToDictionary(u => u.ClerkUserId, u => AttendanceService.DisplayName(u, u.ClerkUserId));
    }

    private string ToBerlin(DateTime utc) =>
        TimeZoneInfo.ConvertTimeFromUtc(DateTime.SpecifyKind(utc, DateTimeKind.Utc), Tz)
            .ToString("yyyy-MM-dd HH:mm:ss", CultureInfo.InvariantCulture);

    private static void WriteRow(StringBuilder sb, params string[] fields)
    {
        for (var i = 0; i < fields.Length; i++)
        {
            if (i > 0) sb.Append(',');
            sb.Append(Escape(fields[i]));
        }
        sb.Append("\r\n");
    }

    private static string Escape(string field)
    {
        if (field.Contains(',') || field.Contains('"') || field.Contains('\n') || field.Contains('\r'))
            return "\"" + field.Replace("\"", "\"\"") + "\"";
        return field;
    }

    private static byte[] WithBom(string content)
    {
        var bom = Encoding.UTF8.GetPreamble();
        var body = Encoding.UTF8.GetBytes(content);
        var result = new byte[bom.Length + body.Length];
        bom.CopyTo(result, 0);
        body.CopyTo(result, bom.Length);
        return result;
    }
}
