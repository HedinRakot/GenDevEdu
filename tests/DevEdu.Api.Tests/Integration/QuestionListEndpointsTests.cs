using System.Net;
using System.Net.Http.Json;
using DevEdu.Api.Dtos;
using MongoDB.Driver;
using Xunit;

namespace DevEdu.Api.Tests.Integration;

[Collection(IntegrationCollection.Name)]
public class QuestionListEndpointsTests
{
    private readonly DevEduApiFactory _factory;
    private readonly HttpClient _client;

    public QuestionListEndpointsTests(DevEduApiFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    /// <summary>Legt eine Fragenliste am (Lesson-)Content an und liefert deren Id.</summary>
    private async Task<string> CreateList(string author, params CreateQuestionRequest[] qs)
    {
        var (courseId, _, contentId) = await Scenarios.PublishedCourseWithLesson(_client, author);
        var create = await _client.PostAsAsync("/api/questionlists", author, "instructor",
            new CreateQuestionListRequest(contentId, qs.ToList()));
        create.EnsureSuccessStatusCode();
        var ql = await _factory.Db.QuestionLists.Find(x => x.CourseId == courseId).FirstAsync();
        return ql.Id;
    }

    private static UpdateQuestionListRequest UpdateWith(params CreateQuestionRequest[] qs) =>
        new(qs.ToList());

    [Fact]
    public async Task UpdateQuestionList_Author_ReplacesQuestions()
    {
        const string author = "author-ql-update";
        var qlId = await CreateList(author, Scenarios.OneChoiceQuestion("Erste?", "richtig", "falsch"));

        var res = await _client.PutAsAsync($"/api/questionlists/{qlId}", author, "instructor",
            UpdateWith(
                Scenarios.OneChoiceQuestion("Neu A?", "a-richtig", "a-falsch"),
                Scenarios.OneChoiceQuestion("Neu B?", "b-richtig", "b-falsch")));
        res.EnsureSuccessStatusCode();

        var model = await res.Content.ReadFromJsonAsync<QuestionListResponseModel>();
        Assert.Equal(2, model!.Questions.Count);

        // Persistenz ueber den Lese-Pfad gegenpruefen (Autor-Sicht).
        var rr = await _client.GetAsAsync($"/api/questionlists/{qlId}", author, "instructor");
        var reread = await rr.Content.ReadFromJsonAsync<QuestionListResponseModel>();
        Assert.Equal(2, reread!.Questions.Count);
        Assert.Contains(reread.Questions, q => q.Titel.Items.Any(i => i.Text == "Neu A?"));
        Assert.DoesNotContain(reread.Questions, q => q.Titel.Items.Any(i => i.Text == "Erste?"));
    }

    [Fact]
    public async Task UpdateQuestionList_OtherAuthor_Returns403()
    {
        var qlId = await CreateList("owner-ql", Scenarios.OneChoiceQuestion("Q?", "r", "f"));
        var res = await _client.PutAsAsync($"/api/questionlists/{qlId}", "intruder-ql", "instructor",
            UpdateWith(Scenarios.OneChoiceQuestion("X?", "r", "f")));
        Assert.Equal(HttpStatusCode.Forbidden, res.StatusCode);
    }

    [Fact]
    public async Task UpdateQuestionList_Learner_Returns403()
    {
        var qlId = await CreateList("owner-ql2", Scenarios.OneChoiceQuestion("Q?", "r", "f"));
        var res = await _client.PutAsAsync($"/api/questionlists/{qlId}", "learner-ql",
            body: UpdateWith(Scenarios.OneChoiceQuestion("X?", "r", "f")));
        Assert.Equal(HttpStatusCode.Forbidden, res.StatusCode);
    }

    [Fact]
    public async Task UpdateQuestionList_Unknown_Returns404()
    {
        var res = await _client.PutAsAsync($"/api/questionlists/{Guid.NewGuid():N}", "author-ql3", "instructor",
            UpdateWith(Scenarios.OneChoiceQuestion("X?", "r", "f")));
        Assert.Equal(HttpStatusCode.NotFound, res.StatusCode);
    }
}
