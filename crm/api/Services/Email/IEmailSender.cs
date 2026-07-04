namespace DevEdu.Crm.Api.Services.Email;

public record EmailMessage(string To, string Subject, string Body);

public record EmailSendResult(bool Sent, string Message);

/// <summary>
/// Versand-Abstraktion. v1 registriert nur den NoOp-Sender (Vorschau-Modus);
/// ein späterer SmtpEmailSender braucht ausschließlich eine andere DI-Registrierung
/// (Config-Switch Email:Sender) — Endpoints und Frontend bleiben unverändert.
/// </summary>
public interface IEmailSender
{
    Task<EmailSendResult> SendAsync(EmailMessage message, CancellationToken ct = default);
}
