using System.Net;
using System.Net.Http.Json;
using System.Text;
using DevEdu.Api.Dtos;
using DevEdu.Api.Models;
using DevEdu.Api.Services;
using MongoDB.Driver;
using Xunit;

namespace DevEdu.Api.Tests.Integration;

[Collection(IntegrationCollection.Name)]
public class AttendanceEndpointsTests
{
    private readonly DevEduApiFactory _factory;
    private readonly HttpClient _client;

    private static readonly TimeZoneInfo Berlin = AttendanceCalculator.GetTimeZone("Europe/Berlin");

    public AttendanceEndpointsTests(DevEduApiFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    private static string NewUser() => $"user_att_{Guid.NewGuid():N}";

    private static AttendanceEventDto Heartbeat(DateTime occurredAt, string? courseId = null) =>
        new(Guid.NewGuid().ToString("N"), "heartbeat", occurredAt, courseId, null, "Lesson", "web");

    /// <summary>Fünf Heartbeats im 60-s-Takt, endend vor wenigen Minuten.</summary>
    private static List<AttendanceEventDto> FiveBeats(out DateTime first, out DateTime last)
    {
        last = DateTime.UtcNow.AddMinutes(-3);
        first = last.AddMinutes(-4);
        var start = first;
        return Enumerable.Range(0, 5).Select(i => Heartbeat(start.AddMinutes(i))).ToList();
    }

    private async Task CreatePeriodAsync(string userId, DateOnly start, DateOnly end, int required = 240)
    {
        var res = await _client.PostAsAsync("/api/admin/attendance/periods", "admin_att", "admin",
            new UpsertTrainingPeriodRequest(userId, start, end, required, "Test-Maßnahme"));
        res.EnsureSuccessStatusCode();
    }

    // ── Ingest ───────────────────────────────────────────────────────────────

    [Fact]
    public async Task PostEvents_MaterializesDailyAttendance_AndIsIdempotent()
    {
        var user = NewUser();
        var events = FiveBeats(out var first, out var last);

        var res = await _client.PostAsAsync("/api/attendance/events", user, null,
            new PostEventsRequest(events));
        res.EnsureSuccessStatusCode();
        var body = await res.Content.ReadFromJsonAsync<PostEventsResponse>();
        Assert.Equal(5, body!.Accepted);
        Assert.Equal(0, body.Duplicates);

        // 4 min Deltas + 60 s Tail = 5 min, ggf. über zwei lokale Tage verteilt.
        var fromDate = AttendanceCalculator.LocalDate(first, Berlin);
        var toDate = AttendanceCalculator.LocalDate(last, Berlin);
        var me = await _client.GetAsAsync($"/api/attendance/me?from={fromDate:yyyy-MM-dd}&to={toDate:yyyy-MM-dd}", user);
        me.EnsureSuccessStatusCode();
        var days = await me.Content.ReadFromJsonAsync<List<DailyAttendanceDto>>();
        Assert.Equal(5, days!.Sum(d => d.Minutes));

        // Idempotenz: identischer Batch → nur Duplikate, keine Doppel-Minuten.
        var retry = await _client.PostAsAsync("/api/attendance/events", user, null,
            new PostEventsRequest(events));
        retry.EnsureSuccessStatusCode();
        var retryBody = await retry.Content.ReadFromJsonAsync<PostEventsResponse>();
        Assert.Equal(0, retryBody!.Accepted);
        Assert.Equal(5, retryBody.Duplicates);

        var meAfter = await _client.GetAsAsync($"/api/attendance/me?from={fromDate:yyyy-MM-dd}&to={toDate:yyyy-MM-dd}", user);
        var daysAfter = await meAfter.Content.ReadFromJsonAsync<List<DailyAttendanceDto>>();
        Assert.Equal(5, daysAfter!.Sum(d => d.Minutes));
    }

    [Fact]
    public async Task PostEvents_Anonymous_Returns401()
    {
        var res = await _client.PostAsJsonAsync("/api/attendance/events",
            new PostEventsRequest(new List<AttendanceEventDto> { Heartbeat(DateTime.UtcNow) }));

        Assert.Equal(HttpStatusCode.Unauthorized, res.StatusCode);
    }

    [Fact]
    public async Task PostEvents_RejectsInvalidTypeMissingIdAndTooOld()
    {
        var user = NewUser();
        var events = new List<AttendanceEventDto>
        {
            new(Guid.NewGuid().ToString("N"), "quatsch", DateTime.UtcNow),          // ungültiger Typ
            new("", "heartbeat", DateTime.UtcNow),                                   // fehlende ClientEventId
            new(Guid.NewGuid().ToString("N"), "heartbeat", DateTime.UtcNow.AddDays(-3)), // älter als 48 h
            Heartbeat(DateTime.UtcNow.AddMinutes(-1)),                               // gültig
        };

        var res = await _client.PostAsAsync("/api/attendance/events", user, null, new PostEventsRequest(events));
        res.EnsureSuccessStatusCode();
        var body = await res.Content.ReadFromJsonAsync<PostEventsResponse>();

        Assert.Equal(1, body!.Accepted);
        Assert.Equal(3, body.Rejected);
    }

    [Fact]
    public async Task PostEvents_FutureTimestamp_IsClampedToServerNow()
    {
        var user = NewUser();
        var res = await _client.PostAsAsync("/api/attendance/events", user, null,
            new PostEventsRequest(new List<AttendanceEventDto> { Heartbeat(DateTime.UtcNow.AddHours(6)) }));
        res.EnsureSuccessStatusCode();

        var stored = await _factory.Db.AttendanceEvents.Find(e => e.UserId == user).FirstAsync();
        Assert.True(stored.OccurredAt <= DateTime.UtcNow.AddSeconds(5));
    }

    // ── Rollen ───────────────────────────────────────────────────────────────

    [Fact]
    public async Task Overview_AsLearner_Returns403()
    {
        var res = await _client.GetAsAsync("/api/attendance/overview", NewUser());
        Assert.Equal(HttpStatusCode.Forbidden, res.StatusCode);
    }

    [Fact]
    public async Task Exports_AsInstructor_Return403()
    {
        var res = await _client.GetAsAsync(
            "/api/admin/attendance/export/daily.csv?from=2026-07-01&to=2026-07-31", "teacher_att", "instructor");
        Assert.Equal(HttpStatusCode.Forbidden, res.StatusCode);
    }

    // ── Übersicht & Detail ───────────────────────────────────────────────────

    [Fact]
    public async Task Overview_ListsLearnerWithPeriod_WithDerivedStatus()
    {
        var user = NewUser();
        // Fester Werktag in der Zukunft: keine Events möglich (Zukunft wird geclampt)
        // → deterministisch "fehlend".
        var wednesday = new DateOnly(2026, 9, 9);
        await CreatePeriodAsync(user, wednesday.AddDays(-7), wednesday.AddDays(7));

        var res = await _client.GetAsAsync($"/api/attendance/overview?date={wednesday:yyyy-MM-dd}", "teacher_att", "instructor");
        res.EnsureSuccessStatusCode();
        var overview = await res.Content.ReadFromJsonAsync<List<LearnerDayOverviewDto>>();

        var entry = Assert.Single(overview!, o => o.UserId == user);
        Assert.Equal("fehlend", entry.Status);
        Assert.Equal(240, entry.RequiredMinutes);
        Assert.Equal(0, entry.Minutes);
    }

    [Fact]
    public async Task LearnerDetail_ShowsMinutes_WithWeekdayAwareStatus()
    {
        var user = NewUser();
        var events = FiveBeats(out var first, out var last);
        var day = AttendanceCalculator.LocalDate(last, Berlin);
        await CreatePeriodAsync(user, day.AddDays(-30), day.AddDays(30));

        var post = await _client.PostAsAsync("/api/attendance/events", user, null, new PostEventsRequest(events));
        post.EnsureSuccessStatusCode();

        var fromDate = AttendanceCalculator.LocalDate(first, Berlin);
        var res = await _client.GetAsAsync(
            $"/api/attendance/learners/{user}?from={fromDate:yyyy-MM-dd}&to={day:yyyy-MM-dd}", "teacher_att", "instructor");
        res.EnsureSuccessStatusCode();
        var days = await res.Content.ReadFromJsonAsync<List<DailyAttendanceDto>>();

        Assert.NotNull(days);
        Assert.Equal(5, days!.Sum(d => d.Minutes));
        // Statuslogik ist wochentagsabhängig — dieselbe Regel wie die Implementierung:
        foreach (var d in days.Where(x => x.Minutes > 0))
        {
            var expected = d.Date.DayOfWeek is DayOfWeek.Saturday or DayOfWeek.Sunday
                ? "keinSolltag" : "teilweise"; // 5 min < 240 min Soll
            Assert.Equal(expected, d.Status);
        }
    }

    [Fact]
    public async Task Sessions_DrillDown_ReturnsSessionizedEvidence()
    {
        var user = NewUser();
        var events = FiveBeats(out _, out var last);
        var post = await _client.PostAsAsync("/api/attendance/events", user, null, new PostEventsRequest(events));
        post.EnsureSuccessStatusCode();

        var day = AttendanceCalculator.LocalDate(last, Berlin);
        var res = await _client.GetAsAsync(
            $"/api/attendance/learners/{user}/days/{day:yyyy-MM-dd}/sessions", "teacher_att", "instructor");
        res.EnsureSuccessStatusCode();
        var sessions = await res.Content.ReadFromJsonAsync<List<AttendanceSessionDto>>();

        Assert.NotEmpty(sessions!);
        Assert.Equal(5, sessions!.Sum(s => s.Minutes));
    }

    // ── Entschuldigungen ─────────────────────────────────────────────────────

    [Fact]
    public async Task ExcuseFlow_CreateRange_Upsert_Delete()
    {
        var user = NewUser();
        var wed = new DateOnly(2026, 9, 16);
        var thu = wed.AddDays(1);
        await CreatePeriodAsync(user, wed.AddDays(-7), wed.AddDays(7));

        // Range-Entschuldigung → 1 Dokument pro Tag
        var create = await _client.PostAsAsync("/api/attendance/excuses", "teacher_att", "instructor",
            new CreateExcuseRequest(user, wed, thu, "krank", "Attest liegt vor"));
        create.EnsureSuccessStatusCode();
        var excuses = await create.Content.ReadFromJsonAsync<List<ExcuseDto>>();
        Assert.Equal(2, excuses!.Count);

        // Detail zeigt entschuldigt
        var detail = await _client.GetAsAsync(
            $"/api/attendance/learners/{user}?from={wed:yyyy-MM-dd}&to={thu:yyyy-MM-dd}", "teacher_att", "instructor");
        var days = await detail.Content.ReadFromJsonAsync<List<DailyAttendanceDto>>();
        Assert.All(days!, d => Assert.Equal("entschuldigt", d.Status));
        Assert.All(days!, d => Assert.Equal("krank", d.ExcuseReason));

        // Upsert statt Duplikat (unique UserId+Date)
        var again = await _client.PostAsAsync("/api/attendance/excuses", "teacher_att", "instructor",
            new CreateExcuseRequest(user, wed, wed, "urlaub"));
        again.EnsureSuccessStatusCode();
        var count = await _factory.Db.ExcusedAbsences.CountDocumentsAsync(e => e.UserId == user);
        Assert.Equal(2, count);

        // Löschen → Tag wieder fehlend
        var delete = await _client.DeleteAsAsync($"/api/attendance/excuses/{excuses[1].Id}", "teacher_att", "instructor");
        Assert.Equal(HttpStatusCode.NoContent, delete.StatusCode);
        var after = await _client.GetAsAsync(
            $"/api/attendance/learners/{user}?from={thu:yyyy-MM-dd}&to={thu:yyyy-MM-dd}", "teacher_att", "instructor");
        var afterDays = await after.Content.ReadFromJsonAsync<List<DailyAttendanceDto>>();
        Assert.Equal("fehlend", Assert.Single(afterDays!).Status);
    }

    [Fact]
    public async Task Excuse_InvalidReason_Returns400()
    {
        var res = await _client.PostAsAsync("/api/attendance/excuses", "teacher_att", "instructor",
            new CreateExcuseRequest(NewUser(), new DateOnly(2026, 9, 16), new DateOnly(2026, 9, 16), "blaumachen"));
        Assert.Equal(HttpStatusCode.BadRequest, res.StatusCode);
    }

    // ── Maßnahmezeiträume ────────────────────────────────────────────────────

    [Fact]
    public async Task Periods_CrudAndOverlapValidation()
    {
        var user = NewUser();

        // Anlegen als Instructor → 403 (Admin-Gruppe)
        var forbidden = await _client.PostAsAsync("/api/admin/attendance/periods", "teacher_att", "instructor",
            new UpsertTrainingPeriodRequest(user, new DateOnly(2026, 8, 1), new DateOnly(2026, 12, 31), 240));
        Assert.Equal(HttpStatusCode.Forbidden, forbidden.StatusCode);

        var create = await _client.PostAsAsync("/api/admin/attendance/periods", "admin_att", "admin",
            new UpsertTrainingPeriodRequest(user, new DateOnly(2026, 8, 1), new DateOnly(2026, 12, 31), 240, "Umschulung"));
        create.EnsureSuccessStatusCode();
        var period = await create.Content.ReadFromJsonAsync<TrainingPeriodDto>();

        // Überlappung → 400
        var overlap = await _client.PostAsAsync("/api/admin/attendance/periods", "admin_att", "admin",
            new UpsertTrainingPeriodRequest(user, new DateOnly(2026, 12, 1), new DateOnly(2027, 3, 31), 240));
        Assert.Equal(HttpStatusCode.BadRequest, overlap.StatusCode);

        // Update
        var update = await _client.PutAsAsync($"/api/admin/attendance/periods/{period!.Id}", "admin_att", "admin",
            new UpsertTrainingPeriodRequest(user, new DateOnly(2026, 8, 1), new DateOnly(2026, 11, 30), 300));
        update.EnsureSuccessStatusCode();
        var updated = await update.Content.ReadFromJsonAsync<TrainingPeriodDto>();
        Assert.Equal(300, updated!.RequiredMinutesPerDay);
        Assert.Equal(new DateOnly(2026, 11, 30), updated.EndDate);

        // Delete
        var delete = await _client.DeleteAsAsync($"/api/admin/attendance/periods/{period.Id}", "admin_att", "admin");
        Assert.Equal(HttpStatusCode.NoContent, delete.StatusCode);
    }

    [Fact]
    public async Task Period_RequiredMinutesOutOfRange_Returns400()
    {
        var res = await _client.PostAsAsync("/api/admin/attendance/periods", "admin_att", "admin",
            new UpsertTrainingPeriodRequest(NewUser(), new DateOnly(2026, 8, 1), new DateOnly(2026, 8, 31), 900));
        Assert.Equal(HttpStatusCode.BadRequest, res.StatusCode);
    }

    // ── Recompute ────────────────────────────────────────────────────────────

    [Fact]
    public async Task Recompute_RestoresDeletedAggregate()
    {
        var user = NewUser();
        var events = FiveBeats(out var first, out var last);
        var post = await _client.PostAsAsync("/api/attendance/events", user, null, new PostEventsRequest(events));
        post.EnsureSuccessStatusCode();

        await _factory.Db.DailyAttendance.DeleteManyAsync(d => d.UserId == user);

        var fromDate = AttendanceCalculator.LocalDate(first, Berlin);
        var toDate = AttendanceCalculator.LocalDate(last, Berlin);
        var res = await _client.PostAsAsync(
            $"/api/admin/attendance/recompute?userId={user}&from={fromDate:yyyy-MM-dd}&to={toDate:yyyy-MM-dd}",
            "admin_att", "admin");
        res.EnsureSuccessStatusCode();
        var body = await res.Content.ReadFromJsonAsync<RecomputeResponse>();
        Assert.True(body!.DaysRecomputed >= 1);

        var restored = await _factory.Db.DailyAttendance.Find(d => d.UserId == user).ToListAsync();
        Assert.Equal(5, restored.Sum(d => d.Minutes));
    }

    // ── Exporte ──────────────────────────────────────────────────────────────

    [Fact]
    public async Task EventsCsv_HasBomHeaderAndRows()
    {
        var user = NewUser();
        var events = FiveBeats(out var first, out var last);
        var post = await _client.PostAsAsync("/api/attendance/events", user, null, new PostEventsRequest(events));
        post.EnsureSuccessStatusCode();

        var fromDate = AttendanceCalculator.LocalDate(first, Berlin);
        var toDate = AttendanceCalculator.LocalDate(last, Berlin);
        var res = await _client.GetAsAsync(
            $"/api/admin/attendance/export/events.csv?userId={user}&from={fromDate:yyyy-MM-dd}&to={toDate:yyyy-MM-dd}",
            "admin_att", "admin");
        res.EnsureSuccessStatusCode();

        Assert.StartsWith("text/csv", res.Content.Headers.ContentType!.MediaType);
        var bytes = await res.Content.ReadAsByteArrayAsync();
        Assert.Equal(new byte[] { 0xEF, 0xBB, 0xBF }, bytes.Take(3).ToArray()); // UTF-8-BOM

        var text = Encoding.UTF8.GetString(bytes);
        var lines = text.Split("\r\n", StringSplitOptions.RemoveEmptyEntries);
        Assert.StartsWith("userId,name,typ,zeitpunktUtc", lines[0]);
        Assert.Equal(6, lines.Length); // Header + 5 Events
        Assert.All(lines.Skip(1), l => Assert.StartsWith(user, l));
    }

    [Fact]
    public async Task DailyCsv_ContainsStatusPerTargetDay()
    {
        var user = NewUser();
        var start = new DateOnly(2026, 9, 7);   // Montag
        var end = new DateOnly(2026, 9, 11);    // Freitag
        await CreatePeriodAsync(user, start, end);

        var res = await _client.GetAsAsync(
            $"/api/admin/attendance/export/daily.csv?userId={user}&from={start:yyyy-MM-dd}&to={end:yyyy-MM-dd}",
            "admin_att", "admin");
        res.EnsureSuccessStatusCode();

        var text = Encoding.UTF8.GetString(await res.Content.ReadAsByteArrayAsync());
        var lines = text.Split("\r\n", StringSplitOptions.RemoveEmptyEntries);
        Assert.Equal(6, lines.Length); // Header + Mo–Fr
        Assert.All(lines.Skip(1), l => Assert.Contains("Fehlend", l)); // keine Events, Solltage
    }

    [Fact]
    public async Task PdfReport_ReturnsValidPdf()
    {
        var user = NewUser();
        await CreatePeriodAsync(user, new DateOnly(2026, 9, 1), new DateOnly(2026, 9, 30));

        var res = await _client.GetAsAsync(
            $"/api/admin/attendance/export/report.pdf?userId={user}&year=2026&month=9", "admin_att", "admin");
        res.EnsureSuccessStatusCode();

        Assert.Equal("application/pdf", res.Content.Headers.ContentType!.MediaType);
        var bytes = await res.Content.ReadAsByteArrayAsync();
        Assert.True(bytes.Length > 1024, $"PDF unerwartet klein: {bytes.Length} Bytes");
        Assert.Equal("%PDF", Encoding.ASCII.GetString(bytes, 0, 4));
    }
}
