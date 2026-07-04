using System.Net;
using System.Net.Http.Json;
using DevEdu.Api.Dtos;
using Xunit;

namespace DevEdu.Api.Tests.Integration;

[Collection(IntegrationCollection.Name)]
public class ChapterQuizEndpointsTests
{
    private readonly HttpClient _client;

    public ChapterQuizEndpointsTests(DevEduApiFactory factory) => _client = factory.CreateClient();

    private static SetChapterQuizRequest QuizReq(int passThreshold, int maxAttempts) =>
        new(
            Questions: new List<CreateQuestionRequest>
            {
                Scenarios.OneChoiceQuestion("2 + 2 = ?", "4", "5"),
            },
            PassThresholdPercent: passThreshold,
            MaxAttempts: maxAttempts);

    /// <summary>Legt als Autor ein Quiz an und gibt (chapterId, correctAnswerId, questionId) zurück.</summary>
    private async Task<(string chapterId, string answerId, string questionId)> SetupQuiz(
        string author, int passThreshold = 60, int maxAttempts = 0)
    {
        var courseId = await Scenarios.CreateCourse(_client, author);
        var chapterId = await Scenarios.AddChapter(_client, author, courseId);
        await Scenarios.Publish(_client, author, courseId);

        var put = await _client.PutAsAsync($"/api/chapters/{chapterId}/quiz", author, "instructor",
            QuizReq(passThreshold, maxAttempts));
        put.EnsureSuccessStatusCode();
        var quiz = await put.Content.ReadFromJsonAsync<ChapterQuizDto>();

        var q = quiz!.Questions[0];
        var correct = q.Answers.First(a => a.IsCorrect);   // reveal=true in der Autor-Antwort
        return (chapterId, correct.Id, q.ElementId);
    }

    [Fact]
    public async Task LearnerView_HidesCorrectAnswerFlags()
    {
        var (chapterId, _, _) = await SetupQuiz("author-reveal");

        var res = await _client.GetAsAsync($"/api/chapters/{chapterId}/quiz", "learner-reveal");
        res.EnsureSuccessStatusCode();
        var quiz = await res.Content.ReadFromJsonAsync<ChapterQuizDto>();

        // Lerner sieht keine isCorrect-Markierung (alle false), obwohl eine Antwort korrekt ist.
        Assert.All(quiz!.Questions[0].Answers, a => Assert.False(a.IsCorrect));
    }

    [Fact]
    public async Task Submit_CorrectAnswer_Passes()
    {
        var (chapterId, answerId, questionId) = await SetupQuiz("author-pass");

        var submit = await _client.PostAsAsync($"/api/chapters/{chapterId}/quiz/attempt", "learner-pass",
            body: new SubmitChapterQuizRequest(new List<ChapterQuizAnswerDto>
            {
                new(questionId, answerId, null),
            }));
        submit.EnsureSuccessStatusCode();
        var result = await submit.Content.ReadFromJsonAsync<ChapterQuizResultDto>();

        Assert.True(result!.Passed);
        Assert.Equal(100, result.Percent);
        Assert.Equal(1, result.CorrectCount);
    }

    [Fact]
    public async Task Submit_BeyondMaxAttempts_IsBlocked()
    {
        var (chapterId, _, questionId) = await SetupQuiz("author-limit", maxAttempts: 1);

        // Erster (falscher) Versuch verbraucht das einzige Kontingent.
        var first = await _client.PostAsAsync($"/api/chapters/{chapterId}/quiz/attempt", "learner-limit",
            body: new SubmitChapterQuizRequest(new List<ChapterQuizAnswerDto>
            {
                new(questionId, "definitely-wrong-id", null),
            }));
        first.EnsureSuccessStatusCode();

        var second = await _client.PostAsAsync($"/api/chapters/{chapterId}/quiz/attempt", "learner-limit",
            body: new SubmitChapterQuizRequest(new List<ChapterQuizAnswerDto>()));
        Assert.Equal(HttpStatusCode.BadRequest, second.StatusCode);
    }

    [Fact]
    public async Task SetQuiz_NonAutoGradableType_Returns400()
    {
        var courseId = await Scenarios.CreateCourse(_client, "author-badtype");
        var chapterId = await Scenarios.AddChapter(_client, "author-badtype", courseId);

        // OwnAnswer (=2) ist nicht auto-bewertbar → Validierungsfehler.
        var req = new SetChapterQuizRequest(
            Questions: new List<CreateQuestionRequest>
            {
                new("Frei", new List<TextItemDto> { new("Frei", 1) }, 2, null, "antwort", null),
            },
            PassThresholdPercent: 50,
            MaxAttempts: 0);

        var res = await _client.PutAsAsync($"/api/chapters/{chapterId}/quiz", "author-badtype", "instructor", req);
        Assert.Equal(HttpStatusCode.BadRequest, res.StatusCode);
    }
}
