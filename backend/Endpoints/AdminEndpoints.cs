using DevEdu.Api.Dtos;
using DevEdu.Api.Models;
using DevEdu.Api.Services;

namespace DevEdu.Api.Endpoints;

public static class AdminEndpoints
{
    public static void MapAdminEndpoints(this IEndpointRouteBuilder app)
    {
        // Nur Admins dürfen Rollen anderer Nutzer einsehen/ändern.
        var admin = app.MapGroup("/api/admin").RequireAuthorization(Policies.AdminOnly);

        // Liste aller Clerk-Nutzer (id, email, role).
        admin.MapGet("/users", async (ClerkAdminService svc) =>
            (await svc.ListUsersAsync()).ToHttp());

        // Rolle eines Nutzers setzen (learner | instructor | admin).
        admin.MapPatch("/users/{id}/role", async (string id, SetRoleRequest req, ClerkAdminService svc) =>
            (await svc.SetRoleAsync(id, req.Role)).ToHttp());
    }
}
