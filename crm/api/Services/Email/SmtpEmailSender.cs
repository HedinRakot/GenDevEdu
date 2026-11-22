using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;

namespace DevEdu.Crm.Api.Services.Email;

/// <summary>
/// Echter E-Mail-Versand über SMTP (MailKit). Aktivierung über Config-Switch
/// <c>Email:Sender=smtp</c> (siehe Program.cs); Zugangsdaten aus <see cref="SmtpOptions"/>.
/// </summary>
public class SmtpEmailSender : IEmailSender
{
    private readonly SmtpOptions _options;
    private readonly ILogger<SmtpEmailSender> _logger;

    public SmtpEmailSender(SmtpOptions options, ILogger<SmtpEmailSender> logger)
    {
        _options = options;
        _logger = logger;
    }

    public async Task<EmailSendResult> SendAsync(EmailMessage message, CancellationToken ct = default)
    {
        var mime = new MimeMessage();
        mime.From.Add(new MailboxAddress(_options.FromName, _options.FromAddress));
        mime.To.Add(MailboxAddress.Parse(message.To));
        mime.Subject = message.Subject;
        mime.Body = new BodyBuilder { HtmlBody = message.Body }.ToMessageBody();

        try
        {
            using var client = new SmtpClient();
            var secure = _options.UseStartTls ? SecureSocketOptions.StartTls : SecureSocketOptions.Auto;
            await client.ConnectAsync(_options.Host, _options.Port, secure, ct);
            if (!string.IsNullOrEmpty(_options.User))
                await client.AuthenticateAsync(_options.User, _options.Password ?? string.Empty, ct);
            await client.SendAsync(mime, ct);
            await client.DisconnectAsync(quit: true, ct);

            _logger.LogInformation("E-Mail versendet. An: {To}, Betreff: {Subject}", message.To, message.Subject);
            return new EmailSendResult(Sent: true, Message: "E-Mail versendet.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "SMTP-Versand fehlgeschlagen. An: {To}", message.To);
            return new EmailSendResult(Sent: false, Message: $"Versand fehlgeschlagen: {ex.Message}");
        }
    }
}
