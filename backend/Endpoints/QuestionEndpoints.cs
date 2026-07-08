using System.Security.Claims;
using DevEdu.Api.Dtos;
using DevEdu.Api.Models;
using DevEdu.Api.Services;

namespace DevEdu.Api.Endpoints;

public static class QuestionEndpoints
{
    public static void MapQuestionEndpoints(this IEndpointRouteBuilder app)
    {
        // ── Lesezugriff ───────────────────────────────────────────────────────

        app.MapGet("/api/questionlists/{id}",
            async (string id, ClaimsPrincipal user, QuestionService svc) =>
                (await svc.GetQuestionListAsync(id, user.UserId(), user.Roles())).ToHttp())
            .RequireAuthorization();

        // ── Attempt einreichen ────────────────────────────────────────────────

        app.MapPost("/api/questions/{id}/attempt",
            async (string id, SubmitAttemptRequest req, ClaimsPrincipal user, QuestionService svc) =>
                (await svc.GradeAttemptAsync(id, req, user.UserId())).ToHttp())
            .RequireAuthorization();

        // ── Author/Admin ──────────────────────────────────────────────────────

        var author = app.MapGroup("").RequireAuthorization(Policies.AuthorOrAdmin);

        author.MapPost("/api/questionlists",
            async (CreateQuestionListRequest req, ClaimsPrincipal user, QuestionService svc) =>
                (await svc.CreateQuestionListAsync(req, user.UserId(), user.IsAdmin())).ToHttp());

        author.MapPut("/api/questionlists/{id}",
            async (string id, UpdateQuestionListRequest req, ClaimsPrincipal user, QuestionService svc) =>
                (await svc.UpdateQuestionListAsync(id, req, user.UserId(), user.IsAdmin())).ToHttp());
    }
}
