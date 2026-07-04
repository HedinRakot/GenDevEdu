namespace DevEdu.Crm.Api.Services.Email;

/// <summary>Versendet nichts — loggt nur und meldet den Vorschau-Modus zurück.</summary>
public class NoOpEmailSender : IEmailSender
{
    private readonly ILogger<NoOpEmailSender> _logger;

    public NoOpEmailSender(ILogger<NoOpEmailSender> logger) => _logger = logger;

    public Task<EmailSendResult> SendAsync(EmailMessage message, CancellationToken ct = default)
    {
        _logger.LogInformation("E-Mail-Versand übersprungen (Vorschau-Modus). An: {To}, Betreff: {Subject}",
            message.To, message.Subject);
        return Task.FromResult(new EmailSendResult(
            Sent: false,
            Message: "E-Mail-Versand ist nicht konfiguriert (Vorschau-Modus)."));
    }
}
