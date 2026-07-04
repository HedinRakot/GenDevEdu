using System.Net.Http.Json;
using DevEdu.Crm.Api.Dtos;
using DevEdu.Crm.Api.Models;
using Xunit;

namespace DevEdu.Crm.Api.Tests.Integration;

public static class TestData
{
    /// <summary>Eindeutiger Teilnehmer pro Test (geteilte DB über die Collection).</summary>
    public static CreateParticipantRequest NewParticipant(
        string? lastName = null,
        PipelinePhase? phase = null,
        DateTime? courseStart = null) => new(
        FirstName: "Max",
        LastName: lastName ?? $"Mustermann-{Guid.NewGuid():N}",
        Email: "max@example.org",
        Phone: "0151 1234567",
        BirthDate: new DateTime(1995, 4, 12, 0, 0, 0, DateTimeKind.Utc),
        Street: "Musterweg 1",
        PostalCode: "01234",
        City: "Musterstadt",
        Agentur: new AgenturDto("K-123456", "Frau Beispiel", "beispiel@arbeitsagentur.de", "0351 999999", "Dresden"),
        Gutschein: new GutscheinDto("BGS-2026-001", new DateTime(2026, 12, 31, 0, 0, 0, DateTimeKind.Utc)),
        Phase: phase,
        CourseStart: courseStart,
        Notes: "Testnotiz");

    public static async Task<ParticipantDto> CreateParticipantAsync(
        HttpClient client, CreateParticipantRequest? request = null)
    {
        var response = await client.PostAsJsonAsync("/api/participants", request ?? NewParticipant(), TestJson.Options);
        response.EnsureSuccessStatusCode();
        var dto = await response.Content.ReadFromJsonAsync<ParticipantDto>(TestJson.Options);
        Assert.NotNull(dto);
        return dto!;
    }
}
