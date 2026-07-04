using System.Net;
using System.Net.Http.Json;
using DevEdu.Crm.Api.Dtos;
using Xunit;

namespace DevEdu.Crm.Api.Tests.Integration;

[Collection(CrmIntegrationCollection.Name)]
public class EmailEndpointsTests
{
    private readonly HttpClient _client;

    public EmailEndpointsTests(CrmApiFactory factory) => _client = factory.CreateClient();

    [Fact]
    public async Task GetTemplate_ReturnsTemplateWithPlaceholderList()
    {
        var template = await _client.GetFromJsonAsync<EmailTemplateDto>(
            "/api/email-templates/welcome", TestJson.Options);

        Assert.NotNull(template);
        Assert.False(string.IsNullOrWhiteSpace(template!.Subject));
        Assert.False(string.IsNullOrWhiteSpace(template.Body));
        Assert.Contains("vorname", template.AvailablePlaceholders);
        Assert.Contains("kursstart", template.AvailablePlaceholders);
    }

    [Fact]
    public async Task UpdateTemplate_Persists()
    {
        var marker = $"Betreff-{Guid.NewGuid():N}";
        var response = await _client.PutAsJsonAsync("/api/email-templates/welcome",
            new UpdateEmailTemplateRequest(marker, "Hallo {{vorname}}!"), TestJson.Options);
        response.EnsureSuccessStatusCode();

        var template = await _client.GetFromJsonAsync<EmailTemplateDto>(
            "/api/email-templates/welcome", TestJson.Options);
        Assert.NotNull(template);
        Assert.Equal(marker, template!.Subject);
        Assert.Equal("Hallo {{vorname}}!", template.Body);
    }

    [Fact]
    public async Task UpdateTemplate_EmptySubject_Returns400()
    {
        var response = await _client.PutAsJsonAsync("/api/email-templates/welcome",
            new UpdateEmailTemplateRequest("", "Body"), TestJson.Options);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task RenderWelcome_SubstitutesPlaceholders_AndReportsUnresolved()
    {
        // Vorlage im Test selbst setzen — unabhängig von Ausführungsreihenfolge/Seed.
        var put = await _client.PutAsJsonAsync("/api/email-templates/welcome",
            new UpdateEmailTemplateRequest(
                "Willkommen, {{vorname}}!",
                "{{anrede}}, Start am {{kursstart}}. Vermittler: {{vermittler_name}}. {{unbekannt}}"),
            TestJson.Options);
        put.EnsureSuccessStatusCode();

        var participant = await TestData.CreateParticipantAsync(_client,
            TestData.NewParticipant(courseStart: new DateTime(2026, 9, 1, 0, 0, 0, DateTimeKind.Utc)));

        var rendered = await _client.GetFromJsonAsync<RenderedEmailDto>(
            $"/api/participants/{participant.Id}/welcome-email", TestJson.Options);

        Assert.NotNull(rendered);
        Assert.Equal("max@example.org", rendered!.To);
        Assert.Equal("Willkommen, Max!", rendered.Subject);
        Assert.Equal("Hallo Max, Start am 01.09.2026. Vermittler: Frau Beispiel. {{unbekannt}}", rendered.Body);
        Assert.Equal(new[] { "unbekannt" }, rendered.UnresolvedPlaceholders);
        Assert.StartsWith("mailto:max%40example.org?subject=", rendered.MailtoUri);
    }

    [Fact]
    public async Task RenderWelcome_WithoutCourseStart_UsesFallbackText()
    {
        var put = await _client.PutAsJsonAsync("/api/email-templates/welcome",
            new UpdateEmailTemplateRequest("Betreff", "Start: {{kursstart}}"), TestJson.Options);
        put.EnsureSuccessStatusCode();

        var participant = await TestData.CreateParticipantAsync(_client);

        var rendered = await _client.GetFromJsonAsync<RenderedEmailDto>(
            $"/api/participants/{participant.Id}/welcome-email", TestJson.Options);

        Assert.NotNull(rendered);
        Assert.Equal("Start: noch offen", rendered!.Body);
    }

    [Fact]
    public async Task RenderWelcome_UnknownParticipant_Returns404()
    {
        var response = await _client.GetAsync("/api/participants/gibt-es-nicht/welcome-email");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task SendWelcome_InPreviewMode_ReturnsNotSent()
    {
        var participant = await TestData.CreateParticipantAsync(_client);

        var response = await _client.PostAsync(
            $"/api/participants/{participant.Id}/welcome-email/send", content: null);
        response.EnsureSuccessStatusCode();
        var result = await response.Content.ReadFromJsonAsync<EmailSendResultDto>(TestJson.Options);

        Assert.NotNull(result);
        Assert.False(result!.Sent);
        Assert.Contains("Vorschau", result.Message);
    }
}
