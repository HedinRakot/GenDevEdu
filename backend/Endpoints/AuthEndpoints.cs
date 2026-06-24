using DevEdu.Api.Dtos;
using DevEdu.Api.Services;

namespace DevEdu.Api.Endpoints;

public static class AuthEndpoints
{
    public static void MapAuthEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/auth");

        group.MapPost("/register", async (RegisterRequest req, AuthService auth) =>
            (await auth.RegisterAsync(req)).ToHttp());

        group.MapPost("/login", async (LoginRequest req, AuthService auth) =>
            (await auth.LoginAsync(req)).ToHttp());

        group.MapPost("/refresh", async (RefreshRequest req, AuthService auth) =>
            (await auth.RefreshAsync(req)).ToHttp());
    }
}
