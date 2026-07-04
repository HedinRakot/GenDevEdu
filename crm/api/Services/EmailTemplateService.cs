using DevEdu.Crm.Api.Dtos;
using DevEdu.Crm.Api.Models;
using DevEdu.Crm.Api.Services.Email;
using MongoDB.Driver;

namespace DevEdu.Crm.Api.Services;

public class EmailTemplateService
{
    /// <summary>
    /// Einzige Quelle der unterstützten Platzhalter — muss mit
    /// <see cref="BuildPlaceholders"/> übereinstimmen (Editor-Hilfe im Frontend).
    /// </summary>
    public static readonly IReadOnlyList<string> AvailablePlaceholders = new[]
    {
        "anrede", "vorname", "nachname", "kursstart",
        "vermittler_name", "kundennummer", "gutschein_nummer", "gutschein_gueltig_bis",
    };

    private const string DefaultSubject = "Willkommen zur Ausbildung, {{vorname}}!";

    private const string DefaultBody = """
        {{anrede}},

        herzlich willkommen zur Ausbildung als Softwareentwickler/in bei Developer Education!

        Dein geplanter Kursstart: {{kursstart}}

        Zu deinem Bildungsgutschein (Nummer: {{gutschein_nummer}}, gültig bis: {{gutschein_gueltig_bis}})
        ist bei der Agentur für Arbeit {{vermittler_name}} zuständig (deine Kundennummer: {{kundennummer}}).

        In den nächsten Tagen erhältst du von uns alle Unterlagen und Zugänge für den Start.
        Bei Fragen kannst du dich jederzeit bei uns melden.

        Wir freuen uns auf dich!

        Viele Grüße
        Dein Developer-Education-Team
        """;

    private readonly MongoContext _db;
    private readonly IEmailSender _sender;

    public EmailTemplateService(MongoContext db, IEmailSender sender)
    {
        _db = db;
        _sender = sender;
    }

    public async Task<ServiceResult<EmailTemplateDto>> GetWelcomeAsync()
    {
        var template = await GetOrCreateWelcomeAsync();
        return ServiceResult<EmailTemplateDto>.Ok(ToDto(template));
    }

    public async Task<ServiceResult<EmailTemplateDto>> UpdateWelcomeAsync(UpdateEmailTemplateRequest req)
    {
        var errors = new List<string>();
        if (string.IsNullOrWhiteSpace(req.Subject)) errors.Add("Betreff ist erforderlich.");
        if (string.IsNullOrWhiteSpace(req.Body)) errors.Add("Text ist erforderlich.");
        if (errors.Count > 0)
            return ServiceResult<EmailTemplateDto>.Validation("Validierungsfehler.", errors);

        var existing = await GetOrCreateWelcomeAsync();
        var update = Builders<EmailTemplate>.Update
            .Set(t => t.Subject, req.Subject!.Trim())
            .Set(t => t.Body, req.Body!.Trim())
            .Set(t => t.UpdatedAt, DateTime.UtcNow);

        var updated = await _db.EmailTemplates.FindOneAndUpdateAsync(
            t => t.Id == existing.Id, update,
            new FindOneAndUpdateOptions<EmailTemplate> { ReturnDocument = ReturnDocument.After });

        return ServiceResult<EmailTemplateDto>.Ok(ToDto(updated));
    }

    public async Task<ServiceResult<RenderedEmailDto>> RenderWelcomeAsync(string participantId)
    {
        var participant = await _db.Participants.Find(p => p.Id == participantId).FirstOrDefaultAsync();
        if (participant is null)
            return ServiceResult<RenderedEmailDto>.NotFound("Teilnehmer nicht gefunden.");

        var template = await GetOrCreateWelcomeAsync();
        var values = BuildPlaceholders(participant);
        var subject = TemplateRenderer.Render(template.Subject, values);
        var body = TemplateRenderer.Render(template.Body, values);
        var unresolved = subject.Unresolved.Concat(body.Unresolved).Distinct().ToList();

        var mailto = $"mailto:{Uri.EscapeDataString(participant.Email)}" +
                     $"?subject={Uri.EscapeDataString(subject.Text)}" +
                     $"&body={Uri.EscapeDataString(body.Text)}";

        return ServiceResult<RenderedEmailDto>.Ok(
            new RenderedEmailDto(participant.Email, subject.Text, body.Text, mailto, unresolved));
    }

    public async Task<ServiceResult<EmailSendResultDto>> SendWelcomeAsync(string participantId, CancellationToken ct = default)
    {
        var rendered = await RenderWelcomeAsync(participantId);
        if (!rendered.IsOk)
            return rendered.As<EmailSendResultDto>();

        var email = rendered.Value!;
        var result = await _sender.SendAsync(new EmailMessage(email.To, email.Subject, email.Body), ct);
        return ServiceResult<EmailSendResultDto>.Ok(new EmailSendResultDto(result.Sent, result.Message));
    }

    /// <summary>Legt die Default-Vorlage idempotent an (auch vom Seeder genutzt).</summary>
    public async Task<EmailTemplate> GetOrCreateWelcomeAsync()
    {
        var existing = await _db.EmailTemplates.Find(t => t.Key == EmailTemplate.WelcomeKey).FirstOrDefaultAsync();
        if (existing is not null)
            return existing;

        var template = new EmailTemplate { Subject = DefaultSubject, Body = DefaultBody };
        try
        {
            await _db.EmailTemplates.InsertOneAsync(template);
            return template;
        }
        catch (MongoWriteException e) when (e.WriteError.Category == ServerErrorCategory.DuplicateKey)
        {
            // Wettlauf mit parallelem Insert (unique Index auf Key) — vorhandene Vorlage lesen.
            return await _db.EmailTemplates.Find(t => t.Key == EmailTemplate.WelcomeKey).FirstAsync();
        }
    }

    internal static IReadOnlyDictionary<string, string> BuildPlaceholders(Participant p) =>
        new Dictionary<string, string>
        {
            ["anrede"] = $"Hallo {p.FirstName}".TrimEnd(),
            ["vorname"] = p.FirstName,
            ["nachname"] = p.LastName,
            ["kursstart"] = p.CourseStart?.ToString("dd.MM.yyyy") ?? "noch offen",
            ["vermittler_name"] = p.Agentur.VermittlerName,
            ["kundennummer"] = p.Agentur.Kundennummer,
            ["gutschein_nummer"] = p.Gutschein.Nummer,
            ["gutschein_gueltig_bis"] = p.Gutschein.GueltigBis?.ToString("dd.MM.yyyy") ?? "noch offen",
        };

    private static EmailTemplateDto ToDto(EmailTemplate t) =>
        new(t.Subject, t.Body, t.UpdatedAt, AvailablePlaceholders);
}
