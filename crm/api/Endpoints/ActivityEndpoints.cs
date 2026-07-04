using DevEdu.Crm.Api.Dtos;
using DevEdu.Crm.Api.Services;

namespace DevEdu.Crm.Api.Endpoints;

public static class ActivityEndpoints
{
    public static void MapActivityEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/participants/{id}/activities");

        group.MapGet("", async (string id, ActivityService svc) =>
            (await svc.ListAsync(id)).ToHttp());

        group.MapPost("", async (string id, CreateActivityRequest req, ActivityService svc) =>
            (await svc.CreateAsync(id, req)).ToHttp());

        group.MapDelete("/{activityId}", async (string id, string activityId, ActivityService svc) =>
            (await svc.DeleteAsync(id, activityId)).ToHttpNoContent());
    }
}
