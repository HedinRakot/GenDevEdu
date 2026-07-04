namespace DevEdu.Crm.Api.Dtos;

public record ErrorResponse(string Error, object? Details = null);
