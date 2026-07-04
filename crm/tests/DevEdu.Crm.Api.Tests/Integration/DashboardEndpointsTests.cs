using System.Net.Http.Json;
using DevEdu.Crm.Api.Dtos;
using DevEdu.Crm.Api.Models;
using Xunit;

namespace DevEdu.Crm.Api.Tests.Integration;

[Collection(CrmIntegrationCollection.Name)]
public class DashboardEndpointsTests
{
    private readonly HttpClient _client;

    public DashboardEndpointsTests(CrmApiFactory factory) => _client = factory.CreateClient();

    [Fact]
    public async Task Dashboard_ListsAllPhases_EvenWithZeroCount()
    {
        var dashboard = await _client.GetFromJsonAsync<DashboardDto>("/api/dashboard", TestJson.Options);

        Assert.NotNull(dashboard);
        Assert.Equal(Enum.GetValues<PipelinePhase>().Length, dashboard!.Phases.Count);
        Assert.Equal(
            Enum.GetValues<PipelinePhase>().ToHashSet(),
            dashboard.Phases.Select(p => p.Phase).ToHashSet());
        Assert.Equal(dashboard.Phases.Sum(p => p.Count), dashboard.Total);
    }

    [Fact]
    public async Task Dashboard_CountsIncrease_WhenParticipantIsCreated()
    {
        // Collection-Tests laufen sequenziell — Vorher/Nachher-Vergleich ist stabil.
        var before = await _client.GetFromJsonAsync<DashboardDto>("/api/dashboard", TestJson.Options);
        Assert.NotNull(before);

        await TestData.CreateParticipantAsync(_client,
            TestData.NewParticipant(phase: PipelinePhase.Abgelehnt));

        var after = await _client.GetFromJsonAsync<DashboardDto>("/api/dashboard", TestJson.Options);
        Assert.NotNull(after);
        Assert.Equal(before!.Total + 1, after!.Total);

        int CountOf(DashboardDto d) => d.Phases.Single(p => p.Phase == PipelinePhase.Abgelehnt).Count;
        Assert.Equal(CountOf(before) + 1, CountOf(after));
    }
}
