using DevEdu.Crm.Api.Dtos;
using DevEdu.Crm.Api.Services;

namespace DevEdu.Crm.Api.Endpoints;

public static class EmailEndpoints
{
    public static void MapEmailEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/email-templates/welcome", async (EmailTemplateService svc) =>
            (await svc.GetWelcomeAsync()).ToHttp());

        app.MapPut("/api/email-templates/welcome", async (UpdateEmailTemplateRequest req, EmailTemplateService svc) =>
            (await svc.UpdateWelcomeAsync(req)).ToHttp());

        app.MapGet("/api/participants/{id}/welcome-email", async (string id, EmailTemplateService svc) =>
            (await svc.RenderWelcomeAsync(id)).ToHttp());

        app.MapPost("/api/participants/{id}/welcome-email/send", async (string id, EmailTemplateService svc, CancellationToken ct) =>
            (await svc.SendWelcomeAsync(id, ct)).ToHttp());
    }
}
