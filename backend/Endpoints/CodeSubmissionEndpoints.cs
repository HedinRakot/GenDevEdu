using System.Security.Claims;
using DevEdu.Api.Dtos;
using DevEdu.Api.Services;

namespace DevEdu.Api.Endpoints;

public static class CodeSubmissionEndpoints
{
    public static void MapCodeSubmissionEndpoints(this IEndpointRouteBuilder app)
    {
        // ── Einreichen → 202 Accepted + Location ──────────────────────────────
        app.MapPost("/api/code-submissions",
            async (SubmitCodeRequest req, ClaimsPrincipal user, CodeSubmissionService svc) =>
            {
                var r = await svc.SubmitAsync(req, user.UserId());
                return r.IsOk
                    ? Results.Accepted($"/api/code-submissions/{r.Value!.Id}", r.Value)
                    : r.ToHttp();
            })
            .RequireAuthorization();

        // ── Status/Ergebnis pollen ────────────────────────────────────────────
        app.MapGet("/api/code-submissions/{id}",
            async (string id, ClaimsPrincipal user, CodeSubmissionService svc) =>
                (await svc.GetAsync(id, user.UserId(), user.Roles())).ToHttp())
            .RequireAuthorization();
    }
}
