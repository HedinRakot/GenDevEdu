using DevEdu.Api.Models;
using DevEdu.Api.Services;
using Xunit;

namespace DevEdu.Api.Tests;

/// <summary>
/// Sicherheitskritisch: SolutionCode und die I/O versteckter Testfälle dürfen
/// Lerner nie erreichen. Diese Tests sperren die Reveal-Logik in Mappers ab.
/// </summary>
public class CodeMapperHidingTests
{
    private static Question CodeQuestion() => new()
    {
        ElementId = "q1",
        Name = "Q",
        QuestionType = MobileQuestionType.Code,
        Code = new CodeQuestion
        {
            StarterCode = "start",
            SolutionCode = "SECRET-SOLUTION",
            TestCases = new()
            {
                new() { Id = "tc-visible", Input = "in-visible", ExpectedOutput = "exp-visible", Hidden = false },
                new() { Id = "tc-hidden", Input = "in-hidden", ExpectedOutput = "exp-hidden", Hidden = true },
            },
        },
    };

    [Fact]
    public void LearnerView_HidesSolutionAndHiddenTestcaseIo()
    {
        var dto = Mappers.ToQuestionDto(CodeQuestion(), revealAnswers: false);

        Assert.NotNull(dto.Code);
        Assert.Null(dto.Code!.SolutionCode);                       // Lösung niemals an Lerner
        Assert.Equal("start", dto.Code.StarterCode);               // Starter-Code ist erlaubt

        var hidden = Assert.Single(dto.Code.TestCases, t => t.Hidden);
        Assert.Null(hidden.Input);
        Assert.Null(hidden.ExpectedOutput);

        var visible = Assert.Single(dto.Code.TestCases, t => !t.Hidden);
        Assert.Equal("in-visible", visible.Input);
        Assert.Equal("exp-visible", visible.ExpectedOutput);
    }

    [Fact]
    public void AuthorView_RevealsSolutionAndHiddenTestcaseIo()
    {
        var dto = Mappers.ToQuestionDto(CodeQuestion(), revealAnswers: true);

        Assert.Equal("SECRET-SOLUTION", dto.Code!.SolutionCode);
        var hidden = Assert.Single(dto.Code.TestCases, t => t.Hidden);
        Assert.Equal("in-hidden", hidden.Input);
        Assert.Equal("exp-hidden", hidden.ExpectedOutput);
    }

    [Fact]
    public void CodeSubmission_LearnerView_HidesHiddenTestResultIo()
    {
        var sub = new CodeSubmission
        {
            Status = CodeSubmissionStatus.Completed,
            Outcome = CodeRunOutcome.Failed,
            PassedCount = 1,
            TotalCount = 2,
            TestResults = new()
            {
                new() { TestCaseId = "t1", Hidden = false, Passed = true,
                        Input = "i", ExpectedOutput = "e", ActualOutput = "e" },
                new() { TestCaseId = "t2", Hidden = true, Passed = false, Outcome = CodeRunOutcome.Failed,
                        Input = "hi", ExpectedOutput = "he", ActualOutput = "x", Stderr = "boom" },
            },
        };

        var dto = Mappers.ToCodeSubmissionDto(sub, reveal: false);

        var hidden = Assert.Single(dto.TestResults, t => t.Hidden);
        Assert.Null(hidden.Input);
        Assert.Null(hidden.ExpectedOutput);
        Assert.Null(hidden.ActualOutput);
        Assert.Null(hidden.Stderr);
        // Pass/Fail + Outcome bleiben sichtbar – nur die I/O wird verborgen.
        Assert.False(hidden.Passed);
        Assert.Equal("Failed", hidden.Outcome);
    }
}
