using System.Security.Claims;
using DevEdu.Api.Dtos;
using DevEdu.Api.Services;

namespace DevEdu.Api.Endpoints;

public static class EnrollmentEndpoints
{
    public static void MapEnrollmentEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapPost("/api/enrollments",
            async (CreateEnrollmentRequest req, ClaimsPrincipal user, EnrollmentService svc) =>
                (await svc.EnrollAsync(req, user.UserId())).ToHttp())
            .RequireAuthorization();

        app.MapGet("/api/me/progress",
            async (ClaimsPrincipal user, EnrollmentService svc) =>
                Results.Ok(await svc.GetProgressAsync(user.UserId())))
            .RequireAuthorization();

        // F9: aggregierte Lerner-Statistiken
        app.MapGet("/api/me/stats",
            async (ClaimsPrincipal user, StatsService svc) =>
                Results.Ok(await svc.GetStatsAsync(user.UserId())))
            .RequireAuthorization();

        app.MapPost("/api/content/{id}/complete",
            async (string id, ClaimsPrincipal user, EnrollmentService svc) =>
                (await svc.CompleteChapterContentAsync(id, user.UserId())).ToHttp())
            .RequireAuthorization();
    }
}
