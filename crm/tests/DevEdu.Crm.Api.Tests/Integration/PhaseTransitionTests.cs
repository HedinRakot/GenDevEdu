using System.Net;
using System.Net.Http.Json;
using System.Text;
using DevEdu.Crm.Api.Dtos;
using DevEdu.Crm.Api.Models;
using Xunit;

namespace DevEdu.Crm.Api.Tests.Integration;

[Collection(CrmIntegrationCollection.Name)]
public class PhaseTransitionTests
{
    private readonly HttpClient _client;

    public PhaseTransitionTests(CrmApiFactory factory) => _client = factory.CreateClient();

    [Fact]
    public async Task ChangePhase_UpdatesPhase_AndAppendsHistoryEntryWithNote()
    {
        var created = await TestData.CreateParticipantAsync(_client);

        var response = await _client.PostAsJsonAsync($"/api/participants/{created.Id}/phase",
            new ChangePhaseRequest(PipelinePhase.Eignungstest, "Test bestanden"), TestJson.Options);
        response.EnsureSuccessStatusCode();
        var updated = await response.Content.ReadFromJsonAsync<ParticipantDto>(TestJson.Options);

        Assert.NotNull(updated);
        Assert.Equal(PipelinePhase.Eignungstest, updated!.Phase);
        Assert.Equal(2, updated.StatusHistory.Count);
        var last = updated.StatusHistory[^1];
        Assert.Equal(PipelinePhase.Eignungstest, last.Phase);
        Assert.Equal("Test bestanden", last.Note);
        Assert.True(last.ChangedAt > DateTime.UtcNow.AddMinutes(-1));
    }

    [Fact]
    public async Task ChangePhase_ToSamePhase_Returns400()
    {
        var created = await TestData.CreateParticipantAsync(_client);

        var response = await _client.PostAsJsonAsync($"/api/participants/{created.Id}/phase",
            new ChangePhaseRequest(PipelinePhase.Erstgespraech), TestJson.Options);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task ChangePhase_InvalidEnumString_Returns400()
    {
        var created = await TestData.CreateParticipantAsync(_client);

        var response = await _client.PostAsync($"/api/participants/{created.Id}/phase",
            new StringContent("""{"phase":"quatschphase"}""", Encoding.UTF8, "application/json"));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task ChangePhase_UnknownParticipant_Returns404()
    {
        var response = await _client.PostAsJsonAsync("/api/participants/gibt-es-nicht/phase",
            new ChangePhaseRequest(PipelinePhase.Abgebrochen), TestJson.Options);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }
}
