using DevEdu.Crm.Api.Dtos;
using DevEdu.Crm.Api.Services;

namespace DevEdu.Crm.Api.Endpoints;

public static class EndpointHelpers
{
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
