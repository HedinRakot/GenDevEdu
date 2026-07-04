namespace DevEdu.Crm.Api.Services;

public enum ResultStatus
{
    Ok,
    Validation,   // 400
    Unauthorized, // 401
    Forbidden,    // 403
    NotFound      // 404
}

/// <summary>
/// Lightweight result wrapper so services can communicate the right HTTP
/// status to the endpoint layer without throwing for control flow.
/// </summary>
public class ServiceResult<T>
{
    public ResultStatus Status { get; init; } = ResultStatus.Ok;
    public T? Value { get; init; }
    public string? Error { get; init; }
    public object? Details { get; init; }

    public bool IsOk => Status == ResultStatus.Ok;

    public static ServiceResult<T> Ok(T value) => new() { Status = ResultStatus.Ok, Value = value };
    public static ServiceResult<T> Validation(string error, object? details = null) =>
        new() { Status = ResultStatus.Validation, Error = error, Details = details };
    public static ServiceResult<T> Unauthorized(string error = "Unauthorized") =>
        new() { Status = ResultStatus.Unauthorized, Error = error };
    public static ServiceResult<T> Forbidden(string error = "Forbidden") =>
        new() { Status = ResultStatus.Forbidden, Error = error };
    public static ServiceResult<T> NotFound(string error = "Not found") =>
        new() { Status = ResultStatus.NotFound, Error = error };

    /// <summary>Überträgt einen Fehlerstatus auf einen anderen Werttyp.</summary>
    public ServiceResult<TOther> As<TOther>() =>
        new() { Status = Status, Error = Error, Details = Details };
}
