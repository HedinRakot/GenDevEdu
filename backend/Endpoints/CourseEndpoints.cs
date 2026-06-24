using System.Security.Claims;
using DevEdu.Api.Dtos;
using DevEdu.Api.Models;
using DevEdu.Api.Services;

namespace DevEdu.Api.Endpoints;

public static class CourseEndpoints
{
    public static void MapCourseEndpoints(this IEndpointRouteBuilder app)
    {
        // ---- read (any authenticated user) ----
        app.MapGet("/api/courses", async (ClaimsPrincipal user, CourseService svc) =>
        {
            var list = await svc.ListAsync(user.UserId(), user.Roles());
            return Results.Ok(list);
        }).RequireAuthorization();

        app.MapGet("/api/courses/{id}", async (string id, ClaimsPrincipal user, CourseService svc) =>
            (await svc.GetTreeAsync(id, user.UserId(), user.Roles())).ToHttp())
            .RequireAuthorization();

        // ---- author-only writes ----
        var author = app.MapGroup("")
            .RequireAuthorization(Policies.AuthorOrAdmin);

        author.MapPost("/api/courses", async (CreateCourseRequest req, ClaimsPrincipal user, CourseService svc) =>
            (await svc.CreateAsync(req, user.UserId())).ToHttp());

        author.MapPut("/api/courses/{id}", async (string id, UpdateCourseRequest req, ClaimsPrincipal user, CourseService svc) =>
            (await svc.UpdateAsync(id, req, user.UserId(), user.IsAdmin())).ToHttp());

        author.MapPost("/api/courses/{id}/publish", async (string id, ClaimsPrincipal user, CourseService svc) =>
            (await svc.PublishAsync(id, user.UserId(), user.IsAdmin())).ToHttp());

        author.MapPost("/api/courses/{id}/chapters", async (string id, CreateChapterRequest req, ClaimsPrincipal user, CourseService svc) =>
            (await svc.AddChapterAsync(id, req, user.UserId(), user.IsAdmin())).ToHttp());

        author.MapPost("/api/chapters/{id}/topics", async (string id, CreateTopicRequest req, ClaimsPrincipal user, CourseService svc) =>
            (await svc.AddTopicAsync(id, req, user.UserId(), user.IsAdmin())).ToHttp());

        author.MapPost("/api/topics/{id}/examples", async (string id, CreateExampleRequest req, ClaimsPrincipal user, CourseService svc) =>
            (await svc.AddExampleAsync(id, req, user.UserId(), user.IsAdmin())).ToHttp());
    }
}
