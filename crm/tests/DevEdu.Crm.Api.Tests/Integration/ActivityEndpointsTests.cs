using System.Net;
using System.Net.Http.Json;
using DevEdu.Crm.Api.Dtos;
using Xunit;

namespace DevEdu.Crm.Api.Tests.Integration;

[Collection(CrmIntegrationCollection.Name)]
public class ActivityEndpointsTests
{
    private readonly HttpClient _client;

    public ActivityEndpointsTests(CrmApiFactory factory) => _client = factory.CreateClient();

    [Fact]
    public async Task CreateAndList_ReturnsNewestFirst()
    {
        var participant = await TestData.CreateParticipantAsync(_client);

        await PostActivityAsync(participant.Id, "Erster Eintrag", "note");
        await Task.Delay(20); // getrennte Zeitstempel für die Sortierprüfung
        await PostActivityAsync(participant.Id, "Zweiter Eintrag", "call");

        var list = await _client.GetFromJsonAsync<List<ActivityDto>>(
            $"/api/participants/{participant.Id}/activities", TestJson.Options);

        Assert.NotNull(list);
        Assert.Equal(2, list!.Count);
        Assert.Equal("Zweiter Eintrag", list[0].Text);
        Assert.Equal("call", list[0].Kind);
        Assert.Equal("Erster Eintrag", list[1].Text);
    }

    [Fact]
    public async Task Create_EmptyText_Returns400()
    {
        var participant = await TestData.CreateParticipantAsync(_client);

        var response = await _client.PostAsJsonAsync($"/api/participants/{participant.Id}/activities",
            new CreateActivityRequest("  "), TestJson.Options);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Create_InvalidKind_Returns400()
    {
        var participant = await TestData.CreateParticipantAsync(_client);

        var response = await _client.PostAsJsonAsync($"/api/participants/{participant.Id}/activities",
            new CreateActivityRequest("Text", "fax"), TestJson.Options);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Create_UnknownParticipant_Returns404()
    {
        var response = await _client.PostAsJsonAsync("/api/participants/gibt-es-nicht/activities",
            new CreateActivityRequest("Text"), TestJson.Options);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Delete_RemovesActivity()
    {
        var participant = await TestData.CreateParticipantAsync(_client);
        var activity = await PostActivityAsync(participant.Id, "Wird gelöscht", "note");

        var response = await _client.DeleteAsync(
            $"/api/participants/{participant.Id}/activities/{activity.Id}");
        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);

        var list = await _client.GetFromJsonAsync<List<ActivityDto>>(
            $"/api/participants/{participant.Id}/activities", TestJson.Options);
        Assert.NotNull(list);
        Assert.Empty(list!);
    }

    [Fact]
    public async Task Delete_UnknownActivity_Returns404()
    {
        var participant = await TestData.CreateParticipantAsync(_client);

        var response = await _client.DeleteAsync(
            $"/api/participants/{participant.Id}/activities/gibt-es-nicht");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    private async Task<ActivityDto> PostActivityAsync(string participantId, string text, string kind)
    {
        var response = await _client.PostAsJsonAsync($"/api/participants/{participantId}/activities",
            new CreateActivityRequest(text, kind), TestJson.Options);
        response.EnsureSuccessStatusCode();
        var dto = await response.Content.ReadFromJsonAsync<ActivityDto>(TestJson.Options);
        Assert.NotNull(dto);
        return dto!;
    }
}
