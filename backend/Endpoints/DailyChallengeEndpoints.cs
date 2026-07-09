using DevEdu.Api.Dtos;
using DevEdu.Api.Models;
using DevEdu.Api.Services;

namespace DevEdu.Api.Endpoints;

public static class DailyChallengeEndpoints
{
    public static void MapDailyChallengeEndpoints(this IEndpointRouteBuilder app)
    {
        // ── Lerner: Challenge des Tages ───────────────────────────────────────
        app.MapGet("/api/daily-challenges/today",
            async (DailyChallengeService svc) =>
            {
                var dto = await svc.GetTodayAsync();
                return dto is null ? Results.NotFound() : Results.Ok(dto);
            })
            .RequireAuthorization();

        // ── Verwaltung (Author/Admin) ─────────────────────────────────────────
        var admin = app.MapGroup("/api/admin/daily-challenges")
            .RequireAuthorization(Policies.AuthorOrAdmin);

        admin.MapGet("", async (DailyChallengeService svc) =>
            Results.Ok(await svc.ListAsync()));

        admin.MapPost("", async (SaveDailyChallengeRequest req, DailyChallengeService svc) =>
            (await svc.CreateAsync(req)).ToHttp());

        admin.MapPut("/{id}", async (string id, SaveDailyChallengeRequest req, DailyChallengeService svc) =>
            (await svc.UpdateAsync(id, req)).ToHttp());

        admin.MapDelete("/{id}", async (string id, DailyChallengeService svc) =>
            (await svc.DeleteAsync(id)).ToHttpNoContent());
    }
}
