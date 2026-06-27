using System.Security.Claims;
using DevEdu.Api.Dtos;
using DevEdu.Api.Models;
using DevEdu.Api.Services;
using Microsoft.AspNetCore.Http.HttpResults;

namespace DevEdu.Api.Endpoints;

public static class EndpointHelpers
{
    public static string UserId(this ClaimsPrincipal user) =>
        user.FindFirstValue(ClaimTypes.NameIdentifier)
        ?? user.FindFirstValue(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)
        ?? string.Empty;

    public static HashSet<string> Roles(this ClaimsPrincipal user) =>
        user.FindAll(ClaimTypes.Role).Select(c => c.Value).ToHashSet();

    public static bool IsAdmin(this ClaimsPrincipal user) => user.Roles().Contains(Models.Roles.Admin);

    /// <summary>
    /// Maps a ServiceResult to an IResult. On success returns 200 with the value.
    /// </summary>
    public static IResult ToHttp<T>(this ServiceResult<T> result)
    {
        return result.Status switch
        {
            ResultStatus.Ok => Results.Ok(result.Value),
            ResultStatus.Validation => Results.BadRequest(new ErrorResponse(result.Error ?? "Validation error.", result.Details)),
            ResultStatus.Unauthorized => Results.Json(new ErrorResponse(result.Error ?? "Unauthorized."), statusCode: StatusCodes.Status401Unauthorized),
            ResultStatus.Forbidden => Results.Json(new ErrorResponse(result.Error ?? "Forbidden."), statusCode: StatusCodes.Status403Forbidden),
            ResultStatus.NotFound => Results.NotFound(new ErrorResponse(result.Error ?? "Not found.")),
            _ => Results.StatusCode(StatusCodes.Status500InternalServerError),
        };
    }

    /// <summary>
    /// Like <see cref="ToHttp{T}"/> but returns 204 No Content on success — for
    /// DELETE endpoints where the body carries no useful payload.
    /// </summary>
    public static IResult ToHttpNoContent<T>(this ServiceResult<T> result) =>
        result.IsOk ? Results.NoContent() : result.ToHttp();
}
