namespace DevEdu.Crm.Api.Dtos;

public record EmailTemplateDto(
    string Subject,
    string Body,
    DateTime UpdatedAt,
    IReadOnlyList<string> AvailablePlaceholders);

public record UpdateEmailTemplateRequest(string? Subject, string? Body);

public record RenderedEmailDto(
    string To,
    string Subject,
    string Body,
    string MailtoUri,
    IReadOnlyList<string> UnresolvedPlaceholders);

public record EmailSendResultDto(bool Sent, string Message);
