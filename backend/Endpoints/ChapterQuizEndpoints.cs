using System.Security.Claims;
using DevEdu.Api.Dtos;
using DevEdu.Api.Models;
using DevEdu.Api.Services;

namespace DevEdu.Api.Endpoints;

public static class ChapterQuizEndpoints
{
    public static void MapChapterQuizEndpoints(this IEndpointRouteBuilder app)
    {
        // ── Lesen + Abgeben (alle authentifizierten Nutzer) ───────────────────
        app.MapGet("/api/chapters/{id}/quiz",
            async (string id, ClaimsPrincipal user, ChapterQuizService svc) =>
                (await svc.GetAsync(id, user.UserId(), user.Roles())).ToHttp())
            .RequireAuthorization();

        app.MapPost("/api/chapters/{id}/quiz/attempt",
            async (string id, SubmitChapterQuizRequest req, ClaimsPrincipal user, ChapterQuizService svc) =>
                (await svc.SubmitAsync(id, req, user.UserId())).ToHttp())
            .RequireAuthorization();

        // ── Autor/Admin: setzen/ersetzen + löschen ────────────────────────────
        var author = app.MapGroup("").RequireAuthorization(Policies.AuthorOrAdmin);

        author.MapPut("/api/chapters/{id}/quiz",
            async (string id, SetChapterQuizRequest req, ClaimsPrincipal user, ChapterQuizService svc) =>
                (await svc.SetAsync(id, req, user.UserId(), user.IsAdmin())).ToHttp());

        author.MapDelete("/api/chapters/{id}/quiz",
            async (string id, ClaimsPrincipal user, ChapterQuizService svc) =>
                (await svc.DeleteAsync(id, user.UserId(), user.IsAdmin())).ToHttpNoContent());
    }
}
