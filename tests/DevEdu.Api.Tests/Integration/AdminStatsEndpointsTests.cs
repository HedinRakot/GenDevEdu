using System.Net;
using System.Net.Http.Json;
using DevEdu.Api.Dtos;
using DevEdu.Api.Models;
using MongoDB.Driver;
using Xunit;

namespace DevEdu.Api.Tests.Integration;

/// <summary>
/// Teilnehmer-Dashboard: GET /api/admin/learners (Übersicht) und
/// GET /api/admin/learners/{userId}/stats (Detail inkl. Fragen-Historie).
/// </summary>
[Collection(IntegrationCollection.Name)]
public class AdminStatsEndpointsTests
{
    private readonly DevEduApiFactory _factory;
    private readonly HttpClient _client;

    public AdminStatsEndpointsTests(DevEduApiFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    /// <summary>Users-Collection wird sonst per Clerk-Webhook gefüllt — im Test direkt.</summary>
    private async Task EnsureUser(string clerkUserId, string name)
    {
        var exists = await _factory.Db.Users.Find(u => u.ClerkUserId == clerkUserId).AnyAsync();
        if (!exists)
            await _factory.Db.Users.InsertOneAsync(new User
            {
                ClerkUserId = clerkUserId,
                Email = $"{clerkUserId}@devedu.test",
                DisplayName = name,
            });
    }

    [Fact]
    public async Task Learners_Staff_ListsLearnerWithProgress()
    {
        const string author = "author-adminstats";
        const string learner = "learner-adminstats";
        await EnsureUser(learner, "Ada Adminstats");

        var (courseId, _, contentId) = await Scenarios.PublishedCourseWithLesson(_client, author);
        await _client.PostAsAsync("/api/enrollments", learner, body: new { courseId });
        (await _client.PostAsAsync($"/api/content/{contentId}/complete", learner)).EnsureSuccessStatusCode();

        var res = await _client.GetAsAsync("/api/admin/learners", author, "instructor");
        res.EnsureSuccessStatusCode();
        var list = await res.Content.ReadFromJsonAsync<List<AdminLearnerSummaryDto>>();

        var row = Assert.Single(list!, r => r.UserId == learner);
        Assert.Equal("Ada Adminstats", row.DisplayName);
        Assert.Equal(100, row.OverallProgressPercent); // 1/1 Inhalt abgeschlossen
        Assert.True(row.Active);                       // LastVisited gerade eben
        Assert.NotNull(row.LastActivityUtc);
    }

    [Fact]
    public async Task LearnerDetail_IncludesWrongAnswerHistory()
    {
        const string author = "author-adminstats-det";
        const string learner = "learner-adminstats-det";
        await EnsureUser(learner, "Bob Detail");

        var (courseId, _, contentId) = await Scenarios.PublishedCourseWithLesson(_client, author);
        var create = await _client.PostAsAsync("/api/questionlists", author, "instructor",
            new CreateQuestionListRequest(contentId,
                new List<CreateQuestionRequest> { Scenarios.OneChoiceQuestion("Detail?", "richtig", "falsch") }));
        create.EnsureSuccessStatusCode();

        var ql = await _factory.Db.QuestionLists.Find(x => x.CourseId == courseId).FirstAsync();
        var question = ql.Questions.Single();
        var wrong = question.Answers.Single(a => !a.IsCorrect);
        (await _client.PostAsAsync($"/api/questions/{question.Id}/attempt", learner,
            body: new { answerId = wrong.Id })).EnsureSuccessStatusCode();

        var res = await _client.GetAsAsync($"/api/admin/learners/{learner}/stats", author, "instructor");
        res.EnsureSuccessStatusCode();
        var detail = await res.Content.ReadFromJsonAsync<AdminLearnerDetailDto>();

        Assert.Equal("Bob Detail", detail!.DisplayName);
        var attempt = Assert.Single(detail.RecentAttempts);
        Assert.False(attempt.IsCorrect);
        Assert.Equal("Detail?", attempt.QuestionText);
        Assert.Equal(new List<string> { "falsch" }, attempt.SelectedAnswers);
        Assert.Equal(1, detail.Stats.TotalAnswered);
    }

    [Fact]
    public async Task LearnerDetail_UnknownUser_Returns404()
    {
        var res = await _client.GetAsAsync("/api/admin/learners/nope-does-not-exist/stats",
            "author-adminstats-404", "instructor");
        Assert.Equal(HttpStatusCode.NotFound, res.StatusCode);
    }

    [Fact]
    public async Task Learners_Learner_Returns403()
    {
        var res = await _client.GetAsAsync("/api/admin/learners", "learner-adminstats-403");
        Assert.Equal(HttpStatusCode.Forbidden, res.StatusCode);
    }
}
