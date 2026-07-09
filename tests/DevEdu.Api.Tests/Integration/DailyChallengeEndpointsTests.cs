using System.Net;
using System.Net.Http.Json;
using DevEdu.Api.Dtos;
using Xunit;

namespace DevEdu.Api.Tests.Integration;

[Collection(IntegrationCollection.Name)]
public class DailyChallengeEndpointsTests
{
    private readonly HttpClient _client;

    public DailyChallengeEndpointsTests(DevEduApiFactory factory) => _client = factory.CreateClient();

    private static SaveDailyChallengeRequest Req(string? id = null, bool active = true) => new(
        Id: id,
        TitleItems: new List<TextItemDto> { new("Titel", 1), new("Title", 2) },
        DescriptionItems: new List<TextItemDto> { new("Beschreibung", 1), new("Description", 2) },
        ExampleSnippet: "Console.WriteLine(42);",
        SnippetLang: "csharp",
        EstimatedMinutes: 5,
        Difficulty: "easy",
        Category: "types",
        Active: active);

    [Fact]
    public async Task Today_Learner_ReturnsSeededChallenge()
    {
        var res = await _client.GetAsAsync("/api/daily-challenges/today", "learner-dc");
        res.EnsureSuccessStatusCode();
        var dto = await res.Content.ReadFromJsonAsync<DailyChallengeDto>();
        Assert.False(string.IsNullOrEmpty(dto!.Id));
        Assert.NotEmpty(dto.Title.Items);
    }

    [Fact]
    public async Task Today_IsSameForAllUsers()
    {
        var a = await (await _client.GetAsAsync("/api/daily-challenges/today", "learner-dc-a"))
            .Content.ReadFromJsonAsync<DailyChallengeDto>();
        var b = await (await _client.GetAsAsync("/api/daily-challenges/today", "learner-dc-b"))
            .Content.ReadFromJsonAsync<DailyChallengeDto>();
        Assert.Equal(a!.Id, b!.Id);
    }

    [Fact]
    public async Task AdminCrud_CreateUpdateDelete_Roundtrip()
    {
        const string author = "author-dc";

        // Create
        var create = await _client.PostAsAsync("/api/admin/daily-challenges", author, "instructor",
            Req(id: "test-roundtrip"));
        create.EnsureSuccessStatusCode();
        var created = await create.Content.ReadFromJsonAsync<DailyChallengeDto>();
        Assert.Equal("test-roundtrip", created!.Id);

        // List enthält die neue Challenge
        var list = await (await _client.GetAsAsync("/api/admin/daily-challenges", author, "instructor"))
            .Content.ReadFromJsonAsync<List<DailyChallengeDto>>();
        Assert.Contains(list!, c => c.Id == "test-roundtrip");

        // Update (deaktivieren)
        var update = await _client.PutAsAsync("/api/admin/daily-challenges/test-roundtrip", author, "instructor",
            Req(active: false));
        update.EnsureSuccessStatusCode();
        var updated = await update.Content.ReadFromJsonAsync<DailyChallengeDto>();
        Assert.False(updated!.Active);

        // Delete
        var del = await _client.DeleteAsAsync("/api/admin/daily-challenges/test-roundtrip", author, "instructor");
        Assert.Equal(HttpStatusCode.NoContent, del.StatusCode);

        var again = await _client.DeleteAsAsync("/api/admin/daily-challenges/test-roundtrip", author, "instructor");
        Assert.Equal(HttpStatusCode.NotFound, again.StatusCode);
    }

    [Fact]
    public async Task AdminCrud_Learner_Returns403()
    {
        var res = await _client.PostAsAsync("/api/admin/daily-challenges", "learner-dc-403",
            body: Req());
        Assert.Equal(HttpStatusCode.Forbidden, res.StatusCode);
    }

    [Fact]
    public async Task Create_InvalidDifficulty_Returns400()
    {
        var res = await _client.PostAsAsync("/api/admin/daily-challenges", "author-dc-400", "instructor",
            Req() with { Difficulty = "impossible" });
        Assert.Equal(HttpStatusCode.BadRequest, res.StatusCode);
    }
}
