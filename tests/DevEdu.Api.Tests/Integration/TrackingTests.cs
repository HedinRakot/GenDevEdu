using System.Net.Http.Json;
using DevEdu.Api.Dtos;
using MongoDB.Driver;
using Xunit;

namespace DevEdu.Api.Tests.Integration;

/// <summary>
/// Tracking-Erweiterung fürs Teilnehmer-Dashboard: gewählte Antworten am Attempt
/// und Abschluss-Zeitstempel je Content-Element am Progress.
/// </summary>
[Collection(IntegrationCollection.Name)]
public class TrackingTests
{
    private readonly DevEduApiFactory _factory;
    private readonly HttpClient _client;

    public TrackingTests(DevEduApiFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task Attempt_PersistsSelectedAnswerIds()
    {
        const string author = "author-track-att";
        const string learner = "learner-track-att";

        var (courseId, _, contentId) = await Scenarios.PublishedCourseWithLesson(_client, author);
        var create = await _client.PostAsAsync("/api/questionlists", author, "instructor",
            new CreateQuestionListRequest(contentId,
                new List<CreateQuestionRequest> { Scenarios.OneChoiceQuestion("Track?", "richtig", "falsch") }));
        create.EnsureSuccessStatusCode();

        var ql = await _factory.Db.QuestionLists.Find(x => x.CourseId == courseId).FirstAsync();
        var question = ql.Questions.Single();
        var wrongAnswer = question.Answers.Single(a => !a.IsCorrect);

        var attempt = await _client.PostAsAsync($"/api/questions/{question.Id}/attempt", learner,
            body: new { answerId = wrongAnswer.Id });
        attempt.EnsureSuccessStatusCode();

        var stored = await _factory.Db.Attempts
            .Find(a => a.UserId == learner && a.QuestionId == question.Id)
            .FirstAsync();
        Assert.False(stored.IsCorrect);
        Assert.Equal(new List<string> { wrongAnswer.Id }, stored.SelectedAnswerIds);
        Assert.Null(stored.SubmittedText);
    }

    [Fact]
    public async Task CompleteContent_RecordsCompletionTimestamp()
    {
        const string author = "author-track-prog";
        const string learner = "learner-track-prog";

        var (courseId, _, contentId) = await Scenarios.PublishedCourseWithLesson(_client, author);
        await _client.PostAsAsync("/api/enrollments", learner, body: new { courseId });

        var before = DateTime.UtcNow.AddSeconds(-5);
        var complete = await _client.PostAsAsync($"/api/content/{contentId}/complete", learner);
        complete.EnsureSuccessStatusCode();

        // Zweiter Abschluss darf keinen weiteren Zeitstempel-Eintrag erzeugen.
        await _client.PostAsAsync($"/api/content/{contentId}/complete", learner);

        var progress = await _factory.Db.Progress
            .Find(p => p.UserId == learner && p.CourseId == courseId)
            .FirstAsync();

        var completion = Assert.Single(progress.ContentCompletions);
        Assert.Equal(contentId, completion.ContentId);
        Assert.InRange(completion.CompletedAtUtc, before, DateTime.UtcNow.AddSeconds(5));
    }
}
