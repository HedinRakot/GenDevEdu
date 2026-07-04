namespace DevEdu.Crm.Api.Dtos;

public record ActivityDto(
    string Id,
    string ParticipantId,
    string Text,
    string Kind,
    DateTime CreatedAt);

public record CreateActivityRequest(string? Text, string? Kind = null);
