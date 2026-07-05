using System.Globalization;
using DevEdu.Api.Models;
using MongoDB.Driver;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace DevEdu.Api.Services;

/// <summary>
/// F14: PDF-Anwesenheitsnachweis pro Lerner und Monat (QuestPDF, Community-Lizenz).
/// Schrift: Liberation Sans (im Container via fonts-liberation installiert),
/// Fallback Arial für Windows-Dev-Maschinen. Deutsche Monats-/Wochentagsnamen
/// sind hart codiert — InvariantGlobalization formatiert sonst englisch.
/// </summary>
public class AttendancePdfService
{
    private readonly MongoContext _db;
    private readonly AttendanceOptions _opt;

    public AttendancePdfService(MongoContext db, AttendanceOptions opt)
    {
        _db = db;
        _opt = opt;
    }

    private TimeZoneInfo Tz => AttendanceCalculator.GetTimeZone(_opt.TimeZone);

    public async Task<ServiceResult<byte[]>> GenerateMonthlyReportAsync(string? userId, int year, int month)
    {
        if (string.IsNullOrWhiteSpace(userId))
            return ServiceResult<byte[]>.Validation("userId ist erforderlich.");
        if (month is < 1 or > 12 || year is < 2000 or > 2100)
            return ServiceResult<byte[]>.Validation("Ungültiger Monat/Jahr.");

        var fromDate = new DateOnly(year, month, 1);
        var toDate = fromDate.AddMonths(1).AddDays(-1);

        var user = await _db.Users.Find(u => u.ClerkUserId == userId).FirstOrDefaultAsync();
        var periods = await _db.TrainingPeriods.Find(p => p.UserId == userId).ToListAsync();
        var aggregates = await _db.DailyAttendance
            .Find(d => d.UserId == userId && d.Date >= fromDate && d.Date <= toDate)
            .ToListAsync();
        var excuses = await _db.ExcusedAbsences
            .Find(e => e.UserId == userId && e.Date >= fromDate && e.Date <= toDate)
            .ToListAsync();

        var aggByDate = aggregates.ToDictionary(a => a.Date);
        var excuseByDate = excuses.ToDictionary(e => e.Date);

        var rows = AttendanceService.EnumerateDays(fromDate, toDate)
            .Select(date =>
            {
                var agg = aggByDate.GetValueOrDefault(date);
                var excuse = excuseByDate.GetValueOrDefault(date);
                var period = AttendanceService.PeriodFor(periods, date);
                var status = AttendanceCalculator.DeriveStatus(date, agg?.Minutes ?? 0, period, excuse);
                return (Date: date, Agg: agg, Excuse: excuse, Status: status);
            })
            .ToList();

        int target = rows.Count(r => r.Status != DayStatus.KeinSolltag);
        int present = rows.Count(r => r.Status == DayStatus.Anwesend);
        int partial = rows.Count(r => r.Status == DayStatus.Teilweise);
        int excused = rows.Count(r => r.Status == DayStatus.Entschuldigt);
        int absent = rows.Count(r => r.Status == DayStatus.Fehlend);
        int totalMinutes = rows.Sum(r => r.Agg?.Minutes ?? 0);

        var displayName = AttendanceService.DisplayName(user, userId);
        var periodForMonth = AttendanceService.PeriodFor(periods, fromDate)
                             ?? AttendanceService.PeriodFor(periods, toDate);
        var monthTitle = $"{AttendanceCalculator.GermanMonth(month)} {year}";
        var generatedAt = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, Tz)
            .ToString("dd.MM.yyyy HH:mm", CultureInfo.InvariantCulture);

        var document = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(36);
                page.DefaultTextStyle(t => t.FontSize(8.5f).FontFamily("Liberation Sans", "Arial"));

                page.Header().Column(col =>
                {
                    col.Item().Row(row =>
                    {
                        row.RelativeItem().Text(_opt.OperatorName).FontSize(11).Bold();
                        row.ConstantItem(150).AlignRight().Text(monthTitle).FontSize(11).Bold();
                    });
                    col.Item().PaddingTop(4).Text("Anwesenheitsnachweis").FontSize(15).Bold();
                    col.Item().PaddingTop(6).Text(t =>
                    {
                        t.Span("Teilnehmer/in: ").SemiBold();
                        t.Span($"{displayName}");
                        if (!string.IsNullOrWhiteSpace(user?.Email))
                            t.Span($"  ·  {user!.Email}");
                    });
                    col.Item().Text(t =>
                    {
                        t.Span("Maßnahme: ").SemiBold();
                        if (periodForMonth is null)
                        {
                            t.Span("kein Maßnahmezeitraum hinterlegt");
                        }
                        else
                        {
                            t.Span(periodForMonth.Label ?? "—");
                            t.Span($"  ·  {Format(periodForMonth.StartDate)} – {Format(periodForMonth.EndDate)}");
                            t.Span($"  ·  Soll: {periodForMonth.RequiredMinutesPerDay} min/Tag");
                        }
                    });
                    col.Item().Text(t =>
                    {
                        t.Span("Nutzer-ID: ").SemiBold();
                        t.Span(userId).FontSize(7);
                    });
                    col.Item().PaddingTop(6).LineHorizontal(0.75f);
                });

                page.Content().PaddingTop(8).Column(col =>
                {
                    col.Item().Table(table =>
                    {
                        table.ColumnsDefinition(c =>
                        {
                            c.ConstantColumn(58);  // Datum
                            c.ConstantColumn(28);  // Wochentag
                            c.ConstantColumn(48);  // Erste Aktivität
                            c.ConstantColumn(48);  // Letzte Aktivität
                            c.ConstantColumn(48);  // Minuten
                            c.ConstantColumn(70);  // Status
                            c.RelativeColumn();    // Bemerkung
                        });

                        table.Header(header =>
                        {
                            foreach (var title in new[]
                                     { "Datum", "Tag", "Beginn", "Ende", "Minuten", "Status", "Bemerkung" })
                            {
                                header.Cell().Background(Colors.Grey.Lighten2)
                                    .Padding(3).Text(title).SemiBold();
                            }
                        });

                        foreach (var (date, agg, excuse, status) in rows)
                        {
                            var background = status switch
                            {
                                DayStatus.KeinSolltag => Colors.Grey.Lighten4,
                                DayStatus.Fehlend => Colors.Red.Lighten4,
                                DayStatus.Teilweise => Colors.Orange.Lighten5,
                                _ => Colors.White,
                            };

                            IContainer Cell() => table.Cell().Background(background)
                                .BorderBottom(0.5f).BorderColor(Colors.Grey.Lighten2).Padding(3);

                            Cell().Text(Format(date));
                            Cell().Text(AttendanceCalculator.GermanWeekday(date));
                            Cell().Text(agg?.FirstActivityUtc is { } f ? BerlinTime(f) : "—");
                            Cell().Text(agg?.LastActivityUtc is { } l ? BerlinTime(l) : "—");
                            Cell().Text(agg is null ? "0" : agg.Minutes.ToString(CultureInfo.InvariantCulture));
                            Cell().Text(AttendanceCalculator.GermanStatus(status))
                                .FontColor(status == DayStatus.Fehlend ? Colors.Red.Darken2 : Colors.Black);
                            Cell().Text(excuse?.Note is { Length: > 0 } note
                                ? $"{AttendanceCalculator.GermanReason(excuse.Reason)}: {note}"
                                : excuse is not null ? AttendanceCalculator.GermanReason(excuse.Reason) : string.Empty);
                        }
                    });

                    col.Item().PaddingTop(10).Text(t =>
                    {
                        t.Span("Zusammenfassung: ").SemiBold();
                        t.Span($"Solltage: {target}  ·  Anwesend: {present}  ·  Teilweise: {partial}" +
                               $"  ·  Entschuldigt: {excused}  ·  Fehlend: {absent}" +
                               $"  ·  Lernzeit gesamt: {totalMinutes / 60} h {totalMinutes % 60} min");
                    });

                    col.Item().PaddingTop(36).Row(row =>
                    {
                        row.RelativeItem().Column(c =>
                        {
                            c.Item().LineHorizontal(0.75f);
                            c.Item().PaddingTop(2).Text("Teilnehmer/in").FontSize(7.5f);
                        });
                        row.ConstantItem(40);
                        row.RelativeItem().Column(c =>
                        {
                            c.Item().LineHorizontal(0.75f);
                            c.Item().PaddingTop(2).Text("Maßnahmeverantwortliche/r").FontSize(7.5f);
                        });
                    });
                });

                page.Footer().PaddingTop(6).Row(row =>
                {
                    row.RelativeItem().Text(
                            $"Erstellt am {generatedAt} — maschinell erstellt auf Basis lückenloser Aktivitätsaufzeichnung (AZAV).")
                        .FontSize(7);
                    row.ConstantItem(60).AlignRight().Text(t =>
                    {
                        t.DefaultTextStyle(s => s.FontSize(7));
                        t.CurrentPageNumber();
                        t.Span(" / ");
                        t.TotalPages();
                    });
                });
            });
        });

        return ServiceResult<byte[]>.Ok(document.GeneratePdf());
    }

    private string BerlinTime(DateTime utc) =>
        TimeZoneInfo.ConvertTimeFromUtc(DateTime.SpecifyKind(utc, DateTimeKind.Utc), Tz)
            .ToString("HH:mm", CultureInfo.InvariantCulture);

    private static string Format(DateOnly date) =>
        date.ToString("dd.MM.yyyy", CultureInfo.InvariantCulture);
}
