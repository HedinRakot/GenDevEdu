using System.Security.Claims;
using DevEdu.Api.Dtos;
using DevEdu.Api.Models;
using DevEdu.Api.Services;

namespace DevEdu.Api.Endpoints;

/// <summary>
/// F14: AZAV-Anwesenheitsnachweis.
/// - /api/attendance/events + /me: jeder angemeldete Nutzer (schreibt nur eigene Daten)
/// - /api/attendance/*: Lehrer/Admin (Übersicht, Detail, Entschuldigungen)
/// - /api/admin/attendance/*: nur Admin (Maßnahmezeiträume, Recompute, Exporte)
/// </summary>
public static class AttendanceEndpoints
{
    public static void MapAttendanceEndpoints(this IEndpointRouteBuilder app)
    {
        // ── Tracking (Learner) ───────────────────────────────────────────────
        var tracking = app.MapGroup("/api/attendance").RequireAuthorization();

        tracking.MapPost("/events", async (PostEventsRequest req, ClaimsPrincipal user, AttendanceService svc) =>
            (await svc.IngestBatchAsync(user.UserId(), req)).ToHttp());

        tracking.MapGet("/me", async (DateOnly? from, DateOnly? to, ClaimsPrincipal user, AttendanceService svc) =>
            (await svc.GetLearnerDaysAsync(user.UserId(), from, to)).ToHttp());

        // ── Lehrer/Admin ─────────────────────────────────────────────────────
        var staff = app.MapGroup("/api/attendance").RequireAuthorization(Policies.AuthorOrAdmin);

        staff.MapGet("/overview", async (DateOnly? date, AttendanceService svc) =>
            (await svc.GetOverviewAsync(date)).ToHttp());

        staff.MapGet("/overview/range", async (DateOnly? from, DateOnly? to, AttendanceService svc) =>
            (await svc.GetRangeOverviewAsync(from, to)).ToHttp());

        staff.MapGet("/learners/{userId}", async (string userId, DateOnly? from, DateOnly? to, AttendanceService svc) =>
            (await svc.GetLearnerDaysAsync(userId, from, to)).ToHttp());

        staff.MapGet("/learners/{userId}/days/{date}/sessions",
            async (string userId, DateOnly date, AttendanceService svc) =>
                (await svc.GetSessionsAsync(userId, date)).ToHttp());

        staff.MapPost("/excuses", async (CreateExcuseRequest req, ClaimsPrincipal user, AttendanceService svc) =>
            (await svc.CreateExcusesAsync(user.UserId(), req)).ToHttp());

        staff.MapGet("/excuses", async (string? userId, DateOnly? from, DateOnly? to, AttendanceService svc) =>
            (await svc.ListExcusesAsync(userId, from, to)).ToHttp());

        staff.MapDelete("/excuses/{id}", async (string id, AttendanceService svc) =>
            (await svc.DeleteExcuseAsync(id)).ToHttpNoContent());

        // ── Admin ────────────────────────────────────────────────────────────
        var admin = app.MapGroup("/api/admin/attendance").RequireAuthorization(Policies.AdminOnly);

        admin.MapGet("/periods", async (string? userId, AttendanceService svc) =>
            (await svc.ListPeriodsAsync(userId)).ToHttp());

        admin.MapPost("/periods", async (UpsertTrainingPeriodRequest req, ClaimsPrincipal user, AttendanceService svc) =>
            (await svc.CreatePeriodAsync(user.UserId(), req)).ToHttp());

        admin.MapPut("/periods/{id}", async (string id, UpsertTrainingPeriodRequest req, AttendanceService svc) =>
            (await svc.UpdatePeriodAsync(id, req)).ToHttp());

        admin.MapDelete("/periods/{id}", async (string id, AttendanceService svc) =>
            (await svc.DeletePeriodAsync(id)).ToHttpNoContent());

        admin.MapPost("/recompute", async (string? userId, DateOnly? from, DateOnly? to, AttendanceService svc) =>
            (await svc.RecomputeRangeAsync(userId, from, to)).ToHttp());

        // Exporte liefern Dateien statt JSON — daher Results.File direkt.
        admin.MapGet("/export/events.csv",
            async (string? userId, DateOnly? from, DateOnly? to, AttendanceExportService svc) =>
            {
                var result = await svc.ExportEventsCsvAsync(userId, from, to);
                return result.IsOk
                    ? Results.File(result.Value!, "text/csv; charset=utf-8",
                        $"events_{userId ?? "alle"}_{from:yyyy-MM-dd}_{to:yyyy-MM-dd}.csv")
                    : result.ToHttp();
            });

        admin.MapGet("/export/daily.csv",
            async (string? userId, DateOnly? from, DateOnly? to, AttendanceExportService svc) =>
            {
                var result = await svc.ExportDailyCsvAsync(userId, from, to);
                return result.IsOk
                    ? Results.File(result.Value!, "text/csv; charset=utf-8",
                        $"anwesenheit_{userId ?? "alle"}_{from:yyyy-MM-dd}_{to:yyyy-MM-dd}.csv")
                    : result.ToHttp();
            });

        admin.MapGet("/export/report.pdf",
            async (string? userId, int year, int month, AttendancePdfService svc) =>
            {
                var result = await svc.GenerateMonthlyReportAsync(userId, year, month);
                return result.IsOk
                    ? Results.File(result.Value!, "application/pdf",
                        $"anwesenheit_{userId}_{year}-{month:00}.pdf")
                    : result.ToHttp();
            });
    }
}
