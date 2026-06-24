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

        app.MapPost("/api/topics/{id}/complete",
            async (string id, ClaimsPrincipal user, EnrollmentService svc) =>
                (await svc.CompleteTopicAsync(id, user.UserId())).ToHttp())
            .RequireAuthorization();
    }
}
