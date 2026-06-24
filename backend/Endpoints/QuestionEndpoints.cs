using System.Security.Claims;
using DevEdu.Api.Dtos;
using DevEdu.Api.Models;
using DevEdu.Api.Services;

namespace DevEdu.Api.Endpoints;

public static class QuestionEndpoints
{
    public static void MapQuestionEndpoints(this IEndpointRouteBuilder app)
    {
        // ---- author-only: create questions ----
        var author = app.MapGroup("")
            .RequireAuthorization(Policies.AuthorOrAdmin);

        author.MapPost("/api/topics/{id}/questions",
            async (string id, CreateQuestionRequest req, ClaimsPrincipal user, QuestionService svc) =>
                (await svc.AddTopicQuestionAsync(id, req, user.UserId(), user.IsAdmin())).ToHttp());

        author.MapPost("/api/chapters/{id}/questions",
            async (string id, CreateQuestionRequest req, ClaimsPrincipal user, QuestionService svc) =>
                (await svc.AddChapterQuestionAsync(id, req, user.UserId(), user.IsAdmin())).ToHttp());

        // ---- learner: submit attempt ----
        app.MapPost("/api/questions/{id}/attempts",
            async (string id, AttemptRequest req, ClaimsPrincipal user, QuestionService svc) =>
                (await svc.GradeAttemptAsync(id, req, user.UserId())).ToHttp())
            .RequireAuthorization();
    }
}
