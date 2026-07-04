using System.Net;
using System.Net.Http.Json;
using DevEdu.Api.Dtos;
using DevEdu.Api.Models;
using MongoDB.Driver;
using Xunit;

namespace DevEdu.Api.Tests.Integration;

[Collection(IntegrationCollection.Name)]
public class CodeSubmissionEndpointsTests
{
    private readonly DevEduApiFactory _factory;
    private readonly HttpClient _client;

    public CodeSubmissionEndpointsTests(DevEduApiFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    /// <summary>Legt eine Code-Frage direkt in der DB an (1 sichtbarer + 1 versteckter Testfall).</summary>
    private async Task<string> SeedCodeQuestion()
    {
        var question = new Question
        {
            QuestionType = MobileQuestionType.Code,
            Code = new CodeQuestion
            {
                Language = CodeLanguage.CSharp,
                StarterCode = "// los",
                SolutionCode = "// solution",
                TestCases = new List<CodeTestCase>
                {
                    new() { Input = "3\n", ExpectedOutput = "6", Hidden = false },
                    new() { Input = "10\n", ExpectedOutput = "20", Hidden = true },
                },
            },
        };
        var ql = new QuestionList
        {
            CourseId = $"course-{Guid.NewGuid():N}",
            Questions = new List<Question> { question },
        };
        await _factory.Db.QuestionLists.InsertOneAsync(ql);
        return question.Id;
    }

    private async Task<CodeSubmissionResultDto> Poll(string id, string sub)
    {
        for (var i = 0; i < 100; i++)
        {
            var res = await _client.GetAsAsync($"/api/code-submissions/{id}", sub);
            res.EnsureSuccessStatusCode();
            var dto = await res.Content.ReadFromJsonAsync<CodeSubmissionResultDto>();
            if (dto!.Status is "Completed" or "Error") return dto;
            await Task.Delay(50);
        }
        throw new Xunit.Sdk.XunitException("Submission did not reach a terminal state in time.");
    }

    [Fact]
    public async Task Submit_PassingCode_CompletesAndWritesAttempt()
    {
        var questionId = await SeedCodeQuestion();
        const string learner = "coder-pass";

        var submit = await _client.PostAsAsync("/api/code-submissions", learner,
            body: new SubmitCodeRequest(questionId, "Console.WriteLine(42);"));
        Assert.Equal(HttpStatusCode.Accepted, submit.StatusCode);
        var accepted = await submit.Content.ReadFromJsonAsync<CodeSubmissionAcceptedDto>();

        var result = await Poll(accepted!.Id, learner);

        Assert.Equal("Completed", result.Status);
        Assert.Equal("Passed", result.Outcome);
        Assert.Equal(2, result.PassedCount);
        Assert.Equal(2, result.TotalCount);

        // F6: bestandene Code-Aufgabe schreibt einen korrekten Attempt.
        var attempts = await _factory.Db.Attempts
            .CountDocumentsAsync(a => a.UserId == learner && a.QuestionId == questionId && a.IsCorrect);
        Assert.True(attempts > 0);
    }

    [Fact]
    public async Task LearnerResult_HidesHiddenTestCaseIO()
    {
        var questionId = await SeedCodeQuestion();
        const string learner = "coder-hidden";

        var submit = await _client.PostAsAsync("/api/code-submissions", learner,
            body: new SubmitCodeRequest(questionId, "Console.WriteLine(42);"));
        var accepted = await submit.Content.ReadFromJsonAsync<CodeSubmissionAcceptedDto>();
        var result = await Poll(accepted!.Id, learner);

        var hidden = result.TestResults.Single(t => t.Hidden);
        Assert.Null(hidden.Input);            // versteckte I/O wird Lernern nicht gezeigt
        Assert.Null(hidden.ExpectedOutput);

        var visible = result.TestResults.Single(t => !t.Hidden);
        Assert.NotNull(visible.ExpectedOutput);
    }

    [Fact]
    public async Task Submit_CompileErrorMarker_ReportsCompileError()
    {
        var questionId = await SeedCodeQuestion();
        const string learner = "coder-ce";

        var submit = await _client.PostAsAsync("/api/code-submissions", learner,
            body: new SubmitCodeRequest(questionId, "// COMPILE_ERROR"));
        var accepted = await submit.Content.ReadFromJsonAsync<CodeSubmissionAcceptedDto>();
        var result = await Poll(accepted!.Id, learner);

        Assert.Equal("CompileError", result.Outcome);
        Assert.Equal(0, result.PassedCount);
        Assert.False(string.IsNullOrEmpty(result.CompileError));
    }

    [Fact]
    public async Task Submit_NonCodeQuestion_Returns400()
    {
        // QuestionList mit einer Nicht-Code-Frage.
        var question = new Question { QuestionType = MobileQuestionType.OneChoice };
        var ql = new QuestionList { CourseId = "c", Questions = new List<Question> { question } };
        await _factory.Db.QuestionLists.InsertOneAsync(ql);

        var res = await _client.PostAsAsync("/api/code-submissions", "coder-x",
            body: new SubmitCodeRequest(question.Id, "code"));
        Assert.Equal(HttpStatusCode.BadRequest, res.StatusCode);
    }
}
