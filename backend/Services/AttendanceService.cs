using DevEdu.Api.Dtos;
using DevEdu.Api.Models;
using MongoDB.Driver;

namespace DevEdu.Api.Services;

/// <summary>
/// F14: DB-Orchestrierung des Anwesenheitsnachweises — Ingest (append-only,
/// idempotent), Materialisierung der Tagesaggregate, Lese-APIs für Lehrer/Admin,
/// Entschuldigungen und Maßnahmezeiträume.
/// </summary>
public class AttendanceService
{
    private const int MaxRangeDays = 400;

    private readonly MongoContext _db;
    private readonly AttendanceOptions _opt;
    private readonly ILogger<AttendanceService> _logger;

    public AttendanceService(MongoContext db, AttendanceOptions opt, ILogger<AttendanceService> logger)
    {
        _db = db;
        _opt = opt;
        _logger = logger;
    }

    private TimeZoneInfo Tz => AttendanceCalculator.GetTimeZone(_opt.TimeZone);

    // ── Ingest ───────────────────────────────────────────────────────────────

    public async Task<ServiceResult<PostEventsResponse>> IngestBatchAsync(string userId, PostEventsRequest? req)
    {
        if (string.IsNullOrEmpty(userId))
            return ServiceResult<PostEventsResponse>.Unauthorized();
        if (req?.Events is null || req.Events.Count == 0)
            return ServiceResult<PostEventsResponse>.Validation("Keine Events übergeben.");
        if (req.Events.Count > _opt.MaxBatchSize)
            return ServiceResult<PostEventsResponse>.Validation($"Maximal {_opt.MaxBatchSize} Events pro Batch.");

        var now = DateTime.UtcNow;
        var oldest = now.AddHours(-_opt.MaxOfflineBufferHours);
        var docs = new List<AttendanceEvent>();
        var rejected = 0;

        foreach (var e in req.Events)
        {
            if (string.IsNullOrWhiteSpace(e.ClientEventId) ||
                !AttendanceCalculator.TryParseEventType(e.Type, out var type))
            {
                rejected++;
                continue;
            }

            // Client-Zeit normalisieren: Zukunft auf Serverzeit clampen (manipulierte
            // Uhren), zu alte Offline-Events ablehnen. ReceivedAt bleibt autoritativ.
            var occurred = e.OccurredAt.Kind == DateTimeKind.Unspecified
                ? DateTime.SpecifyKind(e.OccurredAt, DateTimeKind.Utc)
                : e.OccurredAt.ToUniversalTime();
            if (occurred > now) occurred = now;
            if (occurred < oldest)
            {
                rejected++;
                continue;
            }

            docs.Add(new AttendanceEvent
            {
                UserId = userId,                      // IMMER aus dem Token
                ClientEventId = e.ClientEventId.Trim(),
                Type = type,
                OccurredAt = occurred,
                ReceivedAt = now,
                CourseId = e.CourseId,
                ChapterId = e.ChapterId,
                Screen = e.Screen,
                Platform = e.Platform,
            });
        }

        var duplicates = 0;
        if (docs.Count > 0)
        {
            try
            {
                await _db.AttendanceEvents.InsertManyAsync(docs, new InsertManyOptions { IsOrdered = false });
            }
            catch (MongoBulkWriteException<AttendanceEvent> ex)
            {
                // Unordered InsertMany: Duplikate (Retry desselben Batches) sind ok,
                // alles andere ist ein echter Fehler.
                duplicates = ex.WriteErrors.Count(e => e.Category == ServerErrorCategory.DuplicateKey);
                if (ex.WriteErrors.Any(e => e.Category != ServerErrorCategory.DuplicateKey))
                    throw;
            }

            await RecomputeDaysAsync(userId, TouchedDays(docs));
        }

        return ServiceResult<PostEventsResponse>.Ok(
            new PostEventsResponse(docs.Count - duplicates, duplicates, rejected));
    }

    /// <summary>
    /// Lokale Tage, deren Aggregat ein Event-Batch beeinflusst. Events kurz vor
    /// Mitternacht berühren via Tail-Credit/Session-Split auch den Folgetag.
    /// </summary>
    private HashSet<DateOnly> TouchedDays(IEnumerable<AttendanceEvent> events)
    {
        var carryOver = TimeSpan.FromMinutes(_opt.SessionGapMinutes)
                        + TimeSpan.FromSeconds(_opt.HeartbeatIntervalSeconds);
        var days = new HashSet<DateOnly>();
        foreach (var e in events)
        {
            var date = AttendanceCalculator.LocalDate(e.OccurredAt, Tz);
            days.Add(date);
            if (e.OccurredAt + carryOver >= AttendanceCalculator.DayStartUtc(date.AddDays(1), Tz))
                days.Add(date.AddDays(1));
        }
        return days;
    }

    /// <summary>
    /// Aggregat eines (User, lokalen Tages) aus den Rohevents neu berechnen.
    /// Fenster ± (Gap + Tail), damit Sitzungen über Mitternacht korrekt gesplittet
    /// werden. Idempotent durch deterministische DailyAttendance-Id.
    /// </summary>
    public async Task<int> RecomputeDaysAsync(string userId, IReadOnlyCollection<DateOnly> days)
    {
        var margin = TimeSpan.FromMinutes(_opt.SessionGapMinutes)
                     + TimeSpan.FromSeconds(_opt.HeartbeatIntervalSeconds);
        var recomputed = 0;

        foreach (var date in days)
        {
            var windowStart = AttendanceCalculator.DayStartUtc(date, Tz) - margin;
            var windowEnd = AttendanceCalculator.DayStartUtc(date.AddDays(1), Tz) + margin;

            var events = await _db.AttendanceEvents
                .Find(e => e.UserId == userId && e.OccurredAt >= windowStart && e.OccurredAt <= windowEnd)
                .ToListAsync();

            var aggregates = AttendanceCalculator.AggregateByDay(events, _opt, Tz);
            if (!aggregates.TryGetValue(date, out var agg))
                continue; // keine Daten für diesen Tag — nichts zu materialisieren

            var doc = new DailyAttendance
            {
                Id = DailyAttendance.MakeId(userId, date),
                UserId = userId,
                Date = date,
                Minutes = agg.Minutes,
                FirstActivityUtc = agg.FirstActivityUtc,
                LastActivityUtc = agg.LastActivityUtc,
                SessionCount = agg.SessionCount,
                EventCount = agg.EventCount,
                ComputedAt = DateTime.UtcNow,
            };
            await _db.DailyAttendance.ReplaceOneAsync(
                d => d.Id == doc.Id, doc, new ReplaceOptions { IsUpsert = true });
            recomputed++;
        }
        return recomputed;
    }

    public async Task<ServiceResult<RecomputeResponse>> RecomputeRangeAsync(string? userId, DateOnly? from, DateOnly? to)
    {
        if (string.IsNullOrWhiteSpace(userId))
            return ServiceResult<RecomputeResponse>.Validation("userId ist erforderlich.");
        var range = ValidateRange(from, to);
        if (!range.IsOk) return range.As<RecomputeResponse>();

        var days = EnumerateDays(range.Value!.Value.From, range.Value.Value.To).ToList();
        var recomputed = await RecomputeDaysAsync(userId, days);
        return ServiceResult<RecomputeResponse>.Ok(new RecomputeResponse(recomputed));
    }

    // ── Lese-APIs ────────────────────────────────────────────────────────────

    /// <summary>Tagesliste eines Lerners inkl. Nulltage (für Fehlend-Zeilen).</summary>
    public async Task<ServiceResult<List<DailyAttendanceDto>>> GetLearnerDaysAsync(string userId, DateOnly? from, DateOnly? to)
    {
        var range = ValidateRange(from, to);
        if (!range.IsOk) return range.As<List<DailyAttendanceDto>>();
        var (fromDate, toDate) = range.Value!.Value;

        var aggregates = await _db.DailyAttendance
            .Find(d => d.UserId == userId && d.Date >= fromDate && d.Date <= toDate)
            .ToListAsync();
        var periods = await _db.TrainingPeriods.Find(p => p.UserId == userId).ToListAsync();
        var excuses = await _db.ExcusedAbsences
            .Find(e => e.UserId == userId && e.Date >= fromDate && e.Date <= toDate)
            .ToListAsync();

        var aggByDate = aggregates.ToDictionary(a => a.Date);
        var excuseByDate = excuses.ToDictionary(e => e.Date);

        var result = EnumerateDays(fromDate, toDate)
            .Select(date => BuildDayDto(
                date,
                aggByDate.GetValueOrDefault(date),
                PeriodFor(periods, date),
                excuseByDate.GetValueOrDefault(date)))
            .ToList();
        return ServiceResult<List<DailyAttendanceDto>>.Ok(result);
    }

    /// <summary>Tagesübersicht über alle Lerner mit aktivem Maßnahmezeitraum.</summary>
    public async Task<ServiceResult<List<LearnerDayOverviewDto>>> GetOverviewAsync(DateOnly? date)
    {
        var day = date ?? AttendanceCalculator.LocalDate(DateTime.UtcNow, Tz);

        var periods = await _db.TrainingPeriods
            .Find(p => p.StartDate <= day && p.EndDate >= day)
            .ToListAsync();
        if (periods.Count == 0)
            return ServiceResult<List<LearnerDayOverviewDto>>.Ok(new List<LearnerDayOverviewDto>());

        var userIds = periods.Select(p => p.UserId).Distinct().ToList();
        var users = await _db.Users.Find(u => userIds.Contains(u.ClerkUserId)).ToListAsync();
        var aggregates = await _db.DailyAttendance
            .Find(d => userIds.Contains(d.UserId) && d.Date == day)
            .ToListAsync();
        var excuses = await _db.ExcusedAbsences
            .Find(e => userIds.Contains(e.UserId) && e.Date == day)
            .ToListAsync();

        var userByClerkId = users.ToDictionary(u => u.ClerkUserId);
        var aggByUser = aggregates.ToDictionary(a => a.UserId);
        var excuseByUser = excuses.ToDictionary(e => e.UserId);

        var result = userIds.Select(uid =>
        {
            var period = PeriodFor(periods.Where(p => p.UserId == uid), day);
            var agg = aggByUser.GetValueOrDefault(uid);
            var excuse = excuseByUser.GetValueOrDefault(uid);
            var minutes = agg?.Minutes ?? 0;
            var status = AttendanceCalculator.DeriveStatus(day, minutes, period, excuse);
            var user = userByClerkId.GetValueOrDefault(uid);
            return new LearnerDayOverviewDto(
                uid,
                DisplayName(user, uid),
                user?.Email ?? string.Empty,
                AttendanceCalculator.ToWire(status),
                minutes,
                period?.RequiredMinutesPerDay ?? 0,
                agg?.FirstActivityUtc,
                agg?.LastActivityUtc,
                excuse is null ? null : AttendanceCalculator.ToWire(excuse.Reason));
        })
        .OrderBy(o => o.DisplayName, StringComparer.OrdinalIgnoreCase)
        .ToList();

        return ServiceResult<List<LearnerDayOverviewDto>>.Ok(result);
    }

    /// <summary>Zeitraum-Übersicht pro Lerner (Basis der 7-Tage-Rotflagge).</summary>
    public async Task<ServiceResult<List<LearnerRangeOverviewDto>>> GetRangeOverviewAsync(DateOnly? from, DateOnly? to)
    {
        var range = ValidateRange(from, to);
        if (!range.IsOk) return range.As<List<LearnerRangeOverviewDto>>();
        var (fromDate, toDate) = range.Value!.Value;

        var periods = await _db.TrainingPeriods
            .Find(p => p.StartDate <= toDate && p.EndDate >= fromDate)
            .ToListAsync();
        if (periods.Count == 0)
            return ServiceResult<List<LearnerRangeOverviewDto>>.Ok(new List<LearnerRangeOverviewDto>());

        var userIds = periods.Select(p => p.UserId).Distinct().ToList();
        var users = await _db.Users.Find(u => userIds.Contains(u.ClerkUserId)).ToListAsync();
        var aggregates = await _db.DailyAttendance
            .Find(d => userIds.Contains(d.UserId) && d.Date >= fromDate && d.Date <= toDate)
            .ToListAsync();
        var excuses = await _db.ExcusedAbsences
            .Find(e => userIds.Contains(e.UserId) && e.Date >= fromDate && e.Date <= toDate)
            .ToListAsync();

        var userByClerkId = users.ToDictionary(u => u.ClerkUserId);
        var aggsByUser = aggregates.GroupBy(a => a.UserId).ToDictionary(g => g.Key, g => g.ToDictionary(a => a.Date));
        var excusesByUser = excuses.GroupBy(e => e.UserId).ToDictionary(g => g.Key, g => g.ToDictionary(e => e.Date));

        var result = userIds.Select(uid =>
        {
            var userPeriods = periods.Where(p => p.UserId == uid).ToList();
            var userAggs = aggsByUser.GetValueOrDefault(uid) ?? new Dictionary<DateOnly, DailyAttendance>();
            var userExcuses = excusesByUser.GetValueOrDefault(uid) ?? new Dictionary<DateOnly, ExcusedAbsence>();

            int target = 0, present = 0, partial = 0, excused = 0, absent = 0;
            foreach (var date in EnumerateDays(fromDate, toDate))
            {
                var status = AttendanceCalculator.DeriveStatus(
                    date,
                    userAggs.GetValueOrDefault(date)?.Minutes ?? 0,
                    PeriodFor(userPeriods, date),
                    userExcuses.GetValueOrDefault(date));
                if (status == DayStatus.KeinSolltag) continue;
                target++;
                switch (status)
                {
                    case DayStatus.Anwesend: present++; break;
                    case DayStatus.Teilweise: partial++; break;
                    case DayStatus.Entschuldigt: excused++; break;
                    default: absent++; break;
                }
            }

            var user = userByClerkId.GetValueOrDefault(uid);
            return new LearnerRangeOverviewDto(
                uid,
                DisplayName(user, uid),
                user?.Email ?? string.Empty,
                target, present, partial, excused, absent,
                userAggs.Values.Sum(a => a.Minutes),
                userAggs.Values.Where(a => a.Minutes > 0)
                    .Select(a => (DateOnly?)a.Date).DefaultIfEmpty(null).Max());
        })
        .OrderBy(o => o.DisplayName, StringComparer.OrdinalIgnoreCase)
        .ToList();

        return ServiceResult<List<LearnerRangeOverviewDto>>.Ok(result);
    }

    /// <summary>Sitzungen eines lokalen Tages, on-the-fly aus Rohevents (Drill-down).</summary>
    public async Task<ServiceResult<List<AttendanceSessionDto>>> GetSessionsAsync(string userId, DateOnly date)
    {
        var margin = TimeSpan.FromMinutes(_opt.SessionGapMinutes)
                     + TimeSpan.FromSeconds(_opt.HeartbeatIntervalSeconds);
        var dayStart = AttendanceCalculator.DayStartUtc(date, Tz);
        var dayEnd = AttendanceCalculator.DayStartUtc(date.AddDays(1), Tz);

        var events = await _db.AttendanceEvents
            .Find(e => e.UserId == userId && e.OccurredAt >= dayStart - margin && e.OccurredAt <= dayEnd + margin)
            .ToListAsync();

        var sessions = AttendanceCalculator.Sessionize(events, _opt)
            .Where(s => s.StartUtc < dayEnd && s.EndUtc > dayStart)
            .Select(s => new AttendanceSessionDto(s.StartUtc, s.EndUtc, s.Minutes, s.CourseId, s.Screen))
            .ToList();
        return ServiceResult<List<AttendanceSessionDto>>.Ok(sessions);
    }

    // ── Entschuldigungen ─────────────────────────────────────────────────────

    public async Task<ServiceResult<List<ExcuseDto>>> CreateExcusesAsync(string createdBy, CreateExcuseRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.UserId))
            return ServiceResult<List<ExcuseDto>>.Validation("userId ist erforderlich.");
        if (req.From is null || req.To is null || req.From > req.To)
            return ServiceResult<List<ExcuseDto>>.Validation("Ungültiger Datumsbereich.");
        if (req.To.Value.DayNumber - req.From.Value.DayNumber > 60)
            return ServiceResult<List<ExcuseDto>>.Validation("Maximal 60 Tage pro Entschuldigung.");
        if (!AttendanceCalculator.TryParseReason(req.Reason, out var reason))
            return ServiceResult<List<ExcuseDto>>.Validation(
                "Ungültiger Grund. Erlaubt: krank, urlaub, feiertag, sonstig.");

        var results = new List<ExcuseDto>();
        foreach (var date in EnumerateDays(req.From.Value, req.To.Value))
        {
            // Upsert pro Tag (unique Index UserId+Date): bestehende Entschuldigung
            // wird überschrieben, Id bleibt stabil.
            var update = Builders<ExcusedAbsence>.Update
                .Set(e => e.Reason, reason)
                .Set(e => e.Note, string.IsNullOrWhiteSpace(req.Note) ? null : req.Note.Trim())
                .Set(e => e.CreatedBy, createdBy)
                .Set(e => e.CreatedAt, DateTime.UtcNow)
                .SetOnInsert(e => e.Id, Guid.NewGuid().ToString("N"))
                .SetOnInsert(e => e.UserId, req.UserId)
                .SetOnInsert(e => e.Date, date);
            var doc = await _db.ExcusedAbsences.FindOneAndUpdateAsync<ExcusedAbsence>(
                e => e.UserId == req.UserId && e.Date == date,
                update,
                new FindOneAndUpdateOptions<ExcusedAbsence>
                {
                    IsUpsert = true,
                    ReturnDocument = ReturnDocument.After,
                });
            results.Add(ToDto(doc));
        }
        return ServiceResult<List<ExcuseDto>>.Ok(results);
    }

    public async Task<ServiceResult<List<ExcuseDto>>> ListExcusesAsync(string? userId, DateOnly? from, DateOnly? to)
    {
        var filter = Builders<ExcusedAbsence>.Filter.Empty;
        if (!string.IsNullOrWhiteSpace(userId))
            filter &= Builders<ExcusedAbsence>.Filter.Eq(e => e.UserId, userId);
        if (from is not null)
            filter &= Builders<ExcusedAbsence>.Filter.Gte(e => e.Date, from.Value);
        if (to is not null)
            filter &= Builders<ExcusedAbsence>.Filter.Lte(e => e.Date, to.Value);

        var excuses = await _db.ExcusedAbsences.Find(filter).SortBy(e => e.Date).ToListAsync();
        return ServiceResult<List<ExcuseDto>>.Ok(excuses.Select(ToDto).ToList());
    }

    public async Task<ServiceResult<bool>> DeleteExcuseAsync(string id)
    {
        var result = await _db.ExcusedAbsences.DeleteOneAsync(e => e.Id == id);
        return result.DeletedCount == 0
            ? ServiceResult<bool>.NotFound("Entschuldigung nicht gefunden.")
            : ServiceResult<bool>.Ok(true);
    }

    // ── Maßnahmezeiträume ────────────────────────────────────────────────────

    public async Task<ServiceResult<List<TrainingPeriodDto>>> ListPeriodsAsync(string? userId)
    {
        var filter = string.IsNullOrWhiteSpace(userId)
            ? Builders<TrainingPeriod>.Filter.Empty
            : Builders<TrainingPeriod>.Filter.Eq(p => p.UserId, userId);
        var periods = await _db.TrainingPeriods.Find(filter).SortBy(p => p.UserId).ThenBy(p => p.StartDate).ToListAsync();
        return ServiceResult<List<TrainingPeriodDto>>.Ok(periods.Select(ToDto).ToList());
    }

    public async Task<ServiceResult<TrainingPeriodDto>> CreatePeriodAsync(string createdBy, UpsertTrainingPeriodRequest req)
    {
        var validated = await ValidatePeriodAsync(req, excludeId: null);
        if (!validated.IsOk) return validated.As<TrainingPeriodDto>();
        var (userId, start, end, required) = validated.Value!.Value;

        var period = new TrainingPeriod
        {
            UserId = userId,
            StartDate = start,
            EndDate = end,
            RequiredMinutesPerDay = required,
            Label = string.IsNullOrWhiteSpace(req.Label) ? null : req.Label.Trim(),
            CreatedBy = createdBy,
        };
        await _db.TrainingPeriods.InsertOneAsync(period);
        return ServiceResult<TrainingPeriodDto>.Ok(ToDto(period));
    }

    public async Task<ServiceResult<TrainingPeriodDto>> UpdatePeriodAsync(string id, UpsertTrainingPeriodRequest req)
    {
        var existing = await _db.TrainingPeriods.Find(p => p.Id == id).FirstOrDefaultAsync();
        if (existing is null)
            return ServiceResult<TrainingPeriodDto>.NotFound("Maßnahmezeitraum nicht gefunden.");

        var merged = new UpsertTrainingPeriodRequest(
            req.UserId ?? existing.UserId,
            req.StartDate ?? existing.StartDate,
            req.EndDate ?? existing.EndDate,
            req.RequiredMinutesPerDay ?? existing.RequiredMinutesPerDay,
            req.Label ?? existing.Label);
        var validated = await ValidatePeriodAsync(merged, excludeId: id);
        if (!validated.IsOk) return validated.As<TrainingPeriodDto>();
        var (userId, start, end, required) = validated.Value!.Value;

        var update = Builders<TrainingPeriod>.Update
            .Set(p => p.UserId, userId)
            .Set(p => p.StartDate, start)
            .Set(p => p.EndDate, end)
            .Set(p => p.RequiredMinutesPerDay, required)
            .Set(p => p.Label, string.IsNullOrWhiteSpace(merged.Label) ? null : merged.Label!.Trim());
        var updated = await _db.TrainingPeriods.FindOneAndUpdateAsync<TrainingPeriod>(
            p => p.Id == id, update,
            new FindOneAndUpdateOptions<TrainingPeriod> { ReturnDocument = ReturnDocument.After });
        return ServiceResult<TrainingPeriodDto>.Ok(ToDto(updated));
    }

    public async Task<ServiceResult<bool>> DeletePeriodAsync(string id)
    {
        var result = await _db.TrainingPeriods.DeleteOneAsync(p => p.Id == id);
        return result.DeletedCount == 0
            ? ServiceResult<bool>.NotFound("Maßnahmezeitraum nicht gefunden.")
            : ServiceResult<bool>.Ok(true);
    }

    private async Task<ServiceResult<(string UserId, DateOnly Start, DateOnly End, int Required)?>> ValidatePeriodAsync(
        UpsertTrainingPeriodRequest req, string? excludeId)
    {
        if (string.IsNullOrWhiteSpace(req.UserId))
            return Fail("userId ist erforderlich.");
        if (req.StartDate is null || req.EndDate is null)
            return Fail("startDate und endDate sind erforderlich.");
        if (req.StartDate > req.EndDate)
            return Fail("startDate muss vor endDate liegen.");
        var required = req.RequiredMinutesPerDay ?? _opt.DefaultRequiredMinutesPerDay;
        if (required is < 1 or > 600)
            return Fail("requiredMinutesPerDay muss zwischen 1 und 600 liegen.");

        var overlapping = await _db.TrainingPeriods
            .Find(p => p.UserId == req.UserId && p.Id != excludeId
                       && p.StartDate <= req.EndDate.Value && p.EndDate >= req.StartDate.Value)
            .AnyAsync();
        if (overlapping)
            return Fail("Zeitraum überschneidet sich mit einem bestehenden Maßnahmezeitraum.");

        return ServiceResult<(string, DateOnly, DateOnly, int)?>.Ok(
            (req.UserId.Trim(), req.StartDate.Value, req.EndDate.Value, required));

        static ServiceResult<(string, DateOnly, DateOnly, int)?> Fail(string error) =>
            ServiceResult<(string, DateOnly, DateOnly, int)?>.Validation(error);
    }

    // ── Gemeinsame Helfer (auch für Export/PDF) ──────────────────────────────

    internal static IEnumerable<DateOnly> EnumerateDays(DateOnly from, DateOnly to)
    {
        for (var d = from; d <= to; d = d.AddDays(1))
            yield return d;
    }

    internal static TrainingPeriod? PeriodFor(IEnumerable<TrainingPeriod> periods, DateOnly date) =>
        periods.FirstOrDefault(p => p.StartDate <= date && p.EndDate >= date);

    internal static string DisplayName(User? user, string fallback) =>
        string.IsNullOrWhiteSpace(user?.DisplayName)
            ? (string.IsNullOrWhiteSpace(user?.Email) ? fallback : user!.Email)
            : user!.DisplayName;

    internal static DailyAttendanceDto BuildDayDto(
        DateOnly date, DailyAttendance? agg, TrainingPeriod? period, ExcusedAbsence? excuse)
    {
        var minutes = agg?.Minutes ?? 0;
        var status = AttendanceCalculator.DeriveStatus(date, minutes, period, excuse);
        return new DailyAttendanceDto(
            date,
            minutes,
            period?.RequiredMinutesPerDay ?? 0,
            AttendanceCalculator.ToWire(status),
            agg?.FirstActivityUtc,
            agg?.LastActivityUtc,
            agg?.SessionCount ?? 0,
            excuse is null ? null : AttendanceCalculator.ToWire(excuse.Reason),
            excuse?.Note);
    }

    private ServiceResult<(DateOnly From, DateOnly To)?> ValidateRange(DateOnly? from, DateOnly? to)
    {
        var today = AttendanceCalculator.LocalDate(DateTime.UtcNow, Tz);
        var fromDate = from ?? today.AddDays(-30);
        var toDate = to ?? today;
        if (fromDate > toDate)
            return ServiceResult<(DateOnly, DateOnly)?>.Validation("from muss vor to liegen.");
        if (toDate.DayNumber - fromDate.DayNumber > MaxRangeDays)
            return ServiceResult<(DateOnly, DateOnly)?>.Validation($"Maximal {MaxRangeDays} Tage pro Abfrage.");
        return ServiceResult<(DateOnly, DateOnly)?>.Ok((fromDate, toDate));
    }

    private static ExcuseDto ToDto(ExcusedAbsence e) =>
        new(e.Id, e.UserId, e.Date, AttendanceCalculator.ToWire(e.Reason), e.Note, e.CreatedBy, e.CreatedAt);

    private static TrainingPeriodDto ToDto(TrainingPeriod p) =>
        new(p.Id, p.UserId, p.StartDate, p.EndDate, p.RequiredMinutesPerDay, p.Label);
}
