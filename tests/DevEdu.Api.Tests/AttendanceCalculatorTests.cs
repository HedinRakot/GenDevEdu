using DevEdu.Api.Models;
using DevEdu.Api.Services;
using Xunit;

namespace DevEdu.Api.Tests;

public class AttendanceCalculatorTests
{
    private static readonly AttendanceOptions Options = new()
    {
        HeartbeatIntervalSeconds = 60,
        SessionGapMinutes = 5,
        TimeZone = "Europe/Berlin",
    };

    private static readonly TimeZoneInfo Berlin = AttendanceCalculator.GetTimeZone("Europe/Berlin");

    private static AttendanceEvent Ev(string iso, AttendanceEventType type = AttendanceEventType.Heartbeat,
        string? courseId = null, string? screen = null) => new()
    {
        UserId = "u1",
        ClientEventId = Guid.NewGuid().ToString("N"),
        Type = type,
        OccurredAt = DateTime.Parse(iso, null, System.Globalization.DateTimeStyles.AdjustToUniversal | System.Globalization.DateTimeStyles.AssumeUniversal),
        CourseId = courseId,
        Screen = screen,
    };

    // ── Zeitzone / InvariantGlobalization ───────────────────────────────────

    [Fact]
    public void GetTimeZone_ResolvesEuropeBerlin_DespiteInvariantGlobalization()
    {
        // Schlägt mit TimeZoneInfo.FindSystemTimeZoneById auf Windows+Invariant fehl —
        // dieser Test sichert die TimeZoneConverter-Entscheidung ab.
        var tz = AttendanceCalculator.GetTimeZone("Europe/Berlin");
        Assert.NotNull(tz);
        // Winter: UTC+1
        var winter = new DateTime(2026, 1, 15, 12, 0, 0, DateTimeKind.Utc);
        Assert.Equal(TimeSpan.FromHours(1), tz.GetUtcOffset(winter));
        // Sommer: UTC+2
        var summer = new DateTime(2026, 7, 15, 12, 0, 0, DateTimeKind.Utc);
        Assert.Equal(TimeSpan.FromHours(2), tz.GetUtcOffset(summer));
    }

    // ── Sessionize ──────────────────────────────────────────────────────────

    [Fact]
    public void Sessionize_Empty_ReturnsNoSessions()
    {
        Assert.Empty(AttendanceCalculator.Sessionize(Array.Empty<AttendanceEvent>(), Options));
    }

    [Fact]
    public void Sessionize_SingleHeartbeat_YieldsTailCreditSession()
    {
        var sessions = AttendanceCalculator.Sessionize(new[] { Ev("2026-07-01T10:00:00Z") }, Options);

        var s = Assert.Single(sessions);
        Assert.Equal(60, s.Seconds, precision: 3);
    }

    [Fact]
    public void Sessionize_SixtyBeats_YieldExactlySixtyMinutes()
    {
        // 60 Heartbeats im 60-s-Takt: 10:00:00 … 10:59:00 → 59 min Deltas + 60 s Tail = 60 min.
        var events = Enumerable.Range(0, 60)
            .Select(i => Ev($"2026-07-01T10:{i:00}:00Z"))
            .ToList();

        var sessions = AttendanceCalculator.Sessionize(events, Options);

        var s = Assert.Single(sessions);
        Assert.Equal(60, s.Minutes);
    }

    [Fact]
    public void Sessionize_GapAboveThreshold_SplitsSessions()
    {
        var events = new[]
        {
            Ev("2026-07-01T10:00:00Z"),
            Ev("2026-07-01T10:01:00Z"),
            Ev("2026-07-01T10:07:00Z"), // 6 min Lücke > 5 min
            Ev("2026-07-01T10:08:00Z"),
        };

        var sessions = AttendanceCalculator.Sessionize(events, Options);

        Assert.Equal(2, sessions.Count);
        Assert.Equal(120, sessions[0].Seconds, precision: 3); // 1 min Delta + 60 s Tail
        Assert.Equal(120, sessions[1].Seconds, precision: 3);
    }

    [Fact]
    public void Sessionize_Logout_ClosesSessionWithoutTailCredit()
    {
        var events = new[]
        {
            Ev("2026-07-01T10:00:00Z", AttendanceEventType.Login),
            Ev("2026-07-01T10:01:00Z"),
            Ev("2026-07-01T10:02:00Z", AttendanceEventType.Logout),
            Ev("2026-07-01T10:03:00Z", AttendanceEventType.Login), // neue Sitzung trotz kleiner Lücke
        };

        var sessions = AttendanceCalculator.Sessionize(events, Options);

        Assert.Equal(2, sessions.Count);
        Assert.Equal(120, sessions[0].Seconds, precision: 3); // 10:00–10:02, kein Tail
        Assert.Equal(60, sessions[1].Seconds, precision: 3);
    }

    [Fact]
    public void Sessionize_OutOfOrderInput_IsSortedFirst()
    {
        var events = new[]
        {
            Ev("2026-07-01T10:02:00Z"),
            Ev("2026-07-01T10:00:00Z"),
            Ev("2026-07-01T10:01:00Z"),
        };

        var sessions = AttendanceCalculator.Sessionize(events, Options);

        var s = Assert.Single(sessions);
        Assert.Equal(3, s.Minutes); // 2 min Deltas + 1 min Tail
    }

    [Fact]
    public void Sessionize_PicksDominantCourseAndScreen()
    {
        var events = new[]
        {
            Ev("2026-07-01T10:00:00Z", courseId: "c1", screen: "Lesson"),
            Ev("2026-07-01T10:01:00Z", courseId: "c2", screen: "Lesson"),
            Ev("2026-07-01T10:02:00Z", courseId: "c2", screen: "Quiz"),
        };

        var s = Assert.Single(AttendanceCalculator.Sessionize(events, Options));
        Assert.Equal("c2", s.CourseId);
        Assert.Equal("Lesson", s.Screen);
    }

    // ── AggregateByDay / Bucketing ──────────────────────────────────────────

    [Fact]
    public void AggregateByDay_SummerEvening_BucketsToNextBerlinDay()
    {
        // 2026-07-01 22:30 UTC = 2026-07-02 00:30 Berlin (Sommerzeit UTC+2)
        var events = new[] { Ev("2026-07-01T22:30:00Z") };

        var days = AttendanceCalculator.AggregateByDay(events, Options, Berlin);

        var day = Assert.Single(days);
        Assert.Equal(new DateOnly(2026, 7, 2), day.Key);
        Assert.Equal(1, day.Value.EventCount);
    }

    [Fact]
    public void AggregateByDay_SessionCrossingLocalMidnight_IsSplit()
    {
        // Berlin-Sommerzeit: lokale Mitternacht = 22:00 UTC.
        // Heartbeats 23:50–00:10 lokal = 21:50–22:10 UTC, durchgehend im 60-s-Takt.
        var events = Enumerable.Range(0, 21)
            .Select(i => Ev($"2026-07-01T{(i < 10 ? 21 : 22)}:{(50 + i) % 60:00}:00Z"))
            .ToList();

        var days = AttendanceCalculator.AggregateByDay(events, Options, Berlin);

        Assert.Equal(2, days.Count);
        Assert.Equal(10, days[new DateOnly(2026, 7, 1)].Minutes);  // 23:50–00:00 lokal
        Assert.Equal(11, days[new DateOnly(2026, 7, 2)].Minutes);  // 00:00–00:10 + Tail
        Assert.Equal(21, days.Values.Sum(d => d.EventCount));
    }

    [Fact]
    public void AggregateByDay_SpringForward_CountsRealMinutesNotWallClock()
    {
        // DST 29.03.2026: 02:00 CET → 03:00 CEST. 00:55–01:05 UTC = 01:55 CET – 03:05 CEST.
        // Wanduhr suggeriert 70 min, real sind es 10 min + Tail.
        var events = Enumerable.Range(0, 11)
            .Select(i => Ev($"2026-03-29T0{(55 + i) / 60}:{(55 + i) % 60:00}:00Z"))
            .ToList();

        var days = AttendanceCalculator.AggregateByDay(events, Options, Berlin);

        var day = Assert.Single(days);
        Assert.Equal(new DateOnly(2026, 3, 29), day.Key);
        Assert.Equal(11, day.Value.Minutes); // 10 min Deltas + 60 s Tail — nicht 70
    }

    [Fact]
    public void AggregateByDay_FallBack_AmbiguousHourCountsOnce()
    {
        // DST 25.10.2026: 03:00 CEST → 02:00 CET. 00:30–01:30 UTC überdeckt die doppelte
        // Stunde (02:30 CEST … 02:30 CET) — real 60 min + Tail.
        var events = Enumerable.Range(0, 61)
            .Select(i => Ev($"2026-10-25T0{(30 + i) / 60}:{(30 + i) % 60:00}:00Z"))
            .ToList();

        var days = AttendanceCalculator.AggregateByDay(events, Options, Berlin);

        var day = Assert.Single(days);
        Assert.Equal(new DateOnly(2026, 10, 25), day.Key);
        Assert.Equal(61, day.Value.Minutes);
    }

    [Fact]
    public void AggregateByDay_TracksFirstAndLastActivity()
    {
        var events = new[]
        {
            Ev("2026-07-01T08:00:00Z"),
            Ev("2026-07-01T08:01:00Z"),
            Ev("2026-07-01T15:00:00Z"),
        };

        var day = AttendanceCalculator.AggregateByDay(events, Options, Berlin)[new DateOnly(2026, 7, 1)];

        Assert.Equal(DateTime.Parse("2026-07-01T08:00:00Z").ToUniversalTime(), day.FirstActivityUtc);
        Assert.Equal(DateTime.Parse("2026-07-01T15:00:00Z").ToUniversalTime(), day.LastActivityUtc);
        Assert.Equal(2, day.SessionCount);
    }

    // ── Status-Matrix ───────────────────────────────────────────────────────

    private static TrainingPeriod Period(int required = 240) => new()
    {
        UserId = "u1",
        StartDate = new DateOnly(2026, 7, 1),
        EndDate = new DateOnly(2026, 12, 31),
        RequiredMinutesPerDay = required,
    };

    [Theory]
    // Mittwoch im Zeitraum:
    [InlineData("2026-07-01", 240, false, DayStatus.Anwesend)]
    [InlineData("2026-07-01", 250, false, DayStatus.Anwesend)]
    [InlineData("2026-07-01", 100, false, DayStatus.Teilweise)]
    [InlineData("2026-07-01", 0, false, DayStatus.Fehlend)]
    [InlineData("2026-07-01", 0, true, DayStatus.Entschuldigt)]
    [InlineData("2026-07-01", 300, true, DayStatus.Entschuldigt)] // Entschuldigung schlägt Minuten
    // Wochenende:
    [InlineData("2026-07-04", 300, false, DayStatus.KeinSolltag)] // Samstag
    [InlineData("2026-07-05", 0, false, DayStatus.KeinSolltag)]  // Sonntag
    // Außerhalb des Zeitraums:
    [InlineData("2026-06-30", 300, false, DayStatus.KeinSolltag)]
    public void DeriveStatus_Matrix(string dateIso, int minutes, bool excused, DayStatus expected)
    {
        var date = DateOnly.Parse(dateIso);
        var excuse = excused ? new ExcusedAbsence { UserId = "u1", Date = date, Reason = ExcuseReason.Krank } : null;

        Assert.Equal(expected, AttendanceCalculator.DeriveStatus(date, minutes, Period(), excuse));
    }

    [Fact]
    public void DeriveStatus_WithoutPeriod_IsKeinSolltag()
    {
        Assert.Equal(DayStatus.KeinSolltag,
            AttendanceCalculator.DeriveStatus(new DateOnly(2026, 7, 1), 500, period: null, excuse: null));
    }

    // ── Wire-/Namens-Helfer ─────────────────────────────────────────────────

    [Fact]
    public void GermanNames_AreHardcodedGerman()
    {
        // InvariantGlobalization würde per ToString("MMMM") "March" liefern.
        Assert.Equal("März", AttendanceCalculator.GermanMonth(3));
        Assert.Equal("Mo", AttendanceCalculator.GermanWeekday(new DateOnly(2026, 7, 6)));
        Assert.Equal("So", AttendanceCalculator.GermanWeekday(new DateOnly(2026, 7, 5)));
    }

    [Theory]
    [InlineData("login", true)]
    [InlineData("HEARTBEAT", true)]
    [InlineData("Logout", true)]
    [InlineData("quatsch", false)]
    [InlineData(null, false)]
    public void TryParseEventType_AcceptsKnownTypesCaseInsensitive(string? value, bool expected)
    {
        Assert.Equal(expected, AttendanceCalculator.TryParseEventType(value, out _));
    }
}
