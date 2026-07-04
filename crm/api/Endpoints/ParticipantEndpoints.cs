using DevEdu.Crm.Api.Dtos;
using DevEdu.Crm.Api.Services;

namespace DevEdu.Crm.Api.Endpoints;

public static class ParticipantEndpoints
{
    public static void MapParticipantEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/participants");

        group.MapGet("", async (string? phase, string? search, ParticipantService svc) =>
            (await svc.ListAsync(phase, search)).ToHttp());

        group.MapPost("", async (CreateParticipantRequest req, ParticipantService svc) =>
            (await svc.CreateAsync(req)).ToHttp());

        group.MapGet("/{id}", async (string id, ParticipantService svc) =>
            (await svc.GetAsync(id)).ToHttp());

        group.MapPut("/{id}", async (string id, UpdateParticipantRequest req, ParticipantService svc) =>
            (await svc.UpdateAsync(id, req)).ToHttp());

        group.MapDelete("/{id}", async (string id, ParticipantService svc) =>
            (await svc.DeleteAsync(id)).ToHttpNoContent());

        group.MapPost("/{id}/phase", async (string id, ChangePhaseRequest req, ParticipantService svc) =>
            (await svc.ChangePhaseAsync(id, req)).ToHttp());
    }
}
