namespace DevEdu.Crm.Api.Services;

/// <summary>Idempotentes Seeding beim Start: Default-E-Mail-Vorlage anlegen.</summary>
public class Seeder
{
    private readonly EmailTemplateService _templates;

    public Seeder(EmailTemplateService templates) => _templates = templates;

    public Task SeedAsync() => _templates.GetOrCreateWelcomeAsync();
}
