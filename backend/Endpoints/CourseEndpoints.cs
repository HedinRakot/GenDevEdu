using System.Security.Claims;
using DevEdu.Api.Dtos;
using DevEdu.Api.Models;
using DevEdu.Api.Services;

namespace DevEdu.Api.Endpoints;

public static class CourseEndpoints
{
    public static void MapCourseEndpoints(this IEndpointRouteBuilder app)
    {
        // ── Lesezugriff (alle authentifizierten Nutzer) ───────────────────────

        app.MapGet("/api/courses",
            async (string? search, string? tags, string? level, ClaimsPrincipal user, CourseService svc) =>
            {
                var tagList = string.IsNullOrWhiteSpace(tags)
                    ? null
                    : tags.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries).ToList();
                return Results.Ok(await svc.ListAsync(user.UserId(), user.Roles(), search, tagList, level));
            })
            .RequireAuthorization();

        app.MapGet("/api/courses/tags", async (CourseService svc) =>
            Results.Ok(await svc.GetTagsAsync()))
            .RequireAuthorization();

        app.MapGet("/api/courses/{id}/chapters",
            async (string id, ClaimsPrincipal user, CourseService svc) =>
                (await svc.GetChaptersAsync(id, user.UserId(), user.Roles())).ToHttp())
            .RequireAuthorization();

        app.MapGet("/api/chapters/{id}/content",
            async (string id, ClaimsPrincipal user, CourseService svc) =>
                (await svc.GetChapterContentAsync(id, user.UserId(), user.Roles())).ToHttp())
            .RequireAuthorization();

        // ── Author/Admin-Schreibzugriff ───────────────────────────────────────

        var author = app.MapGroup("").RequireAuthorization(Policies.AuthorOrAdmin);

        author.MapPost("/api/courses",
            async (CreateCourseRequest req, ClaimsPrincipal user, CourseService svc) =>
                (await svc.CreateAsync(req, user.UserId())).ToHttp());

        author.MapPost("/api/courses/{id}/publish",
            async (string id, ClaimsPrincipal user, CourseService svc) =>
                (await svc.PublishAsync(id, user.UserId(), user.IsAdmin())).ToHttp());

        author.MapPost("/api/courses/{id}/chapters",
            async (string id, CreateChapterRequest req, ClaimsPrincipal user, CourseService svc) =>
                (await svc.AddChapterAsync(id, req, user.UserId(), user.IsAdmin())).ToHttp());

        author.MapPost("/api/chapters/{id}/content",
            async (string id, CreateChapterContentRequest req, ClaimsPrincipal user, CourseService svc) =>
                (await svc.AddChapterContentAsync(id, req, user.UserId(), user.IsAdmin())).ToHttp());

        author.MapPut("/api/content/{id}",
            async (string id, CreateChapterContentRequest req, ClaimsPrincipal user, CourseService svc) =>
                (await svc.UpdateChapterContentAsync(id, req, user.UserId(), user.IsAdmin())).ToHttp());

        // ── Reihenfolge (Author/Admin) ────────────────────────────────────────

        author.MapPut("/api/courses/{id}/chapters/order",
            async (string id, ReorderRequest req, ClaimsPrincipal user, CourseService svc) =>
                (await svc.ReorderChaptersAsync(id, req, user.UserId(), user.IsAdmin())).ToHttpNoContent());

        author.MapPut("/api/chapters/{id}/contents/order",
            async (string id, ReorderRequest req, ClaimsPrincipal user, CourseService svc) =>
                (await svc.ReorderChapterContentAsync(id, req, user.UserId(), user.IsAdmin())).ToHttpNoContent());

        // ── Löschen (Author/Admin) ────────────────────────────────────────────

        author.MapDelete("/api/courses/{id}",
            async (string id, ClaimsPrincipal user, CourseService svc) =>
                (await svc.DeleteCourseAsync(id, user.UserId(), user.IsAdmin())).ToHttpNoContent());

        author.MapDelete("/api/chapters/{id}",
            async (string id, ClaimsPrincipal user, CourseService svc) =>
                (await svc.DeleteChapterAsync(id, user.UserId(), user.IsAdmin())).ToHttpNoContent());

        author.MapDelete("/api/content/{id}",
            async (string id, ClaimsPrincipal user, CourseService svc) =>
                (await svc.DeleteChapterContentAsync(id, user.UserId(), user.IsAdmin())).ToHttpNoContent());
    }
}
