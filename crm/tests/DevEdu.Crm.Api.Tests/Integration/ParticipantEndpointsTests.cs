using System.Net;
using System.Net.Http.Json;
using DevEdu.Crm.Api.Dtos;
using DevEdu.Crm.Api.Models;
using MongoDB.Driver;
using Xunit;

namespace DevEdu.Crm.Api.Tests.Integration;

[Collection(CrmIntegrationCollection.Name)]
public class ParticipantEndpointsTests
{
    private readonly CrmApiFactory _factory;
    private readonly HttpClient _client;

    public ParticipantEndpointsTests(CrmApiFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task Create_ReturnsParticipant_WithInitialHistoryEntry()
    {
        var created = await TestData.CreateParticipantAsync(_client);

        Assert.Equal("Max", created.FirstName);
        Assert.Equal(PipelinePhase.Erstgespraech, created.Phase);
        Assert.Equal("K-123456", created.Agentur.Kundennummer);
        Assert.Equal("BGS-2026-001", created.Gutschein.Nummer);
        var entry = Assert.Single(created.StatusHistory);
        Assert.Equal(PipelinePhase.Erstgespraech, entry.Phase);
    }

    [Fact]
    public async Task Create_WithExplicitPhase_StartsThere()
    {
        var created = await TestData.CreateParticipantAsync(
            _client, TestData.NewParticipant(phase: PipelinePhase.Eignungstest));

        Assert.Equal(PipelinePhase.Eignungstest, created.Phase);
        Assert.Equal(PipelinePhase.Eignungstest, Assert.Single(created.StatusHistory).Phase);
    }

    [Fact]
    public async Task Create_WithoutLastName_Returns400()
    {
        var response = await _client.PostAsJsonAsync("/api/participants",
            new CreateParticipantRequest("Max", LastName: null), TestJson.Options);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Get_Unknown_Returns404()
    {
        var response = await _client.GetAsync("/api/participants/gibt-es-nicht");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Update_ChangesMasterData_ButNotPhase()
    {
        var created = await TestData.CreateParticipantAsync(_client);

        var update = new UpdateParticipantRequest(
            FirstName: "Moritz", LastName: created.LastName, City: "Neustadt",
            Agentur: new AgenturDto("K-999", "Herr Neu", "", "", ""),
            Gutschein: new GutscheinDto("BGS-NEU", null));
        var response = await _client.PutAsJsonAsync($"/api/participants/{created.Id}", update, TestJson.Options);
        response.EnsureSuccessStatusCode();
        var updated = await response.Content.ReadFromJsonAsync<ParticipantDto>(TestJson.Options);

        Assert.NotNull(updated);
        Assert.Equal("Moritz", updated!.FirstName);
        Assert.Equal("Neustadt", updated.City);
        Assert.Equal("K-999", updated.Agentur.Kundennummer);
        Assert.Equal(created.Phase, updated.Phase);
        Assert.Equal(created.StatusHistory.Count, updated.StatusHistory.Count);
    }

    [Fact]
    public async Task Update_Unknown_Returns404()
    {
        var response = await _client.PutAsJsonAsync("/api/participants/gibt-es-nicht",
            new UpdateParticipantRequest("Max", "Mustermann"), TestJson.Options);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Delete_RemovesParticipantAndActivities()
    {
        var created = await TestData.CreateParticipantAsync(_client);
        var activityResponse = await _client.PostAsJsonAsync(
            $"/api/participants/{created.Id}/activities",
            new CreateActivityRequest("Telefonat geführt", "call"), TestJson.Options);
        activityResponse.EnsureSuccessStatusCode();

        var deleteResponse = await _client.DeleteAsync($"/api/participants/{created.Id}");
        Assert.Equal(HttpStatusCode.NoContent, deleteResponse.StatusCode);

        var getResponse = await _client.GetAsync($"/api/participants/{created.Id}");
        Assert.Equal(HttpStatusCode.NotFound, getResponse.StatusCode);

        var remaining = await _factory.Db.Activities
            .CountDocumentsAsync(a => a.ParticipantId == created.Id);
        Assert.Equal(0, remaining);
    }

    [Fact]
    public async Task Delete_Unknown_Returns404()
    {
        var response = await _client.DeleteAsync("/api/participants/gibt-es-nicht");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task List_FiltersBySearchAndPhase()
    {
        var marker = $"Suchtest-{Guid.NewGuid():N}";
        await TestData.CreateParticipantAsync(_client, TestData.NewParticipant(lastName: $"{marker}-A"));
        await TestData.CreateParticipantAsync(_client,
            TestData.NewParticipant(lastName: $"{marker}-B", phase: PipelinePhase.GutscheinBeantragt));

        var all = await _client.GetFromJsonAsync<List<ParticipantListItemDto>>(
            $"/api/participants?search={marker}", TestJson.Options);
        Assert.NotNull(all);
        Assert.Equal(2, all!.Count);

        var filtered = await _client.GetFromJsonAsync<List<ParticipantListItemDto>>(
            $"/api/participants?search={marker}&phase=gutscheinBeantragt", TestJson.Options);
        Assert.NotNull(filtered);
        var item = Assert.Single(filtered!);
        Assert.Equal($"{marker}-B", item.LastName);
        Assert.Equal(PipelinePhase.GutscheinBeantragt, item.Phase);
    }

    [Fact]
    public async Task List_InvalidPhase_Returns400()
    {
        var response = await _client.GetAsync("/api/participants?phase=quatschphase");

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }
}
