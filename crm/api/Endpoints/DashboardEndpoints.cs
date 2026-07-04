using DevEdu.Crm.Api.Services;

namespace DevEdu.Crm.Api.Endpoints;

public static class DashboardEndpoints
{
    public static void MapDashboardEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/dashboard", async (ParticipantService svc) =>
            (await svc.GetDashboardAsync()).ToHttp());
    }
}
