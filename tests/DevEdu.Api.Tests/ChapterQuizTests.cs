using DevEdu.Api.Models;
using DevEdu.Api.Services;
using Xunit;

namespace DevEdu.Api.Tests;

public class GradingTests
{
    private static Question OneChoice(string correctId) => new()
    {
        QuestionType = MobileQuestionType.OneChoice,
        Answers = new()
        {
            new() { Id = "a", IsCorrect = correctId == "a" },
            new() { Id = "b", IsCorrect = correctId == "b" },
        },
    };

    private static Question Multi(params string[] correctIds) => new()
    {
        QuestionType = MobileQuestionType.MultipleChoice,
        Answers = new()
        {
            new() { Id = "a", IsCorrect = correctIds.Contains("a") },
            new() { Id = "b", IsCorrect = correctIds.Contains("b") },
            new() { Id = "c", IsCorrect = correctIds.Contains("c") },
        },
    };

    [Fact]
    public void OneChoice_GradedByAnswerId()
    {
        var q = OneChoice("a");
        Assert.True(Grading.IsCorrect(q, "a", null));
        Assert.False(Grading.IsCorrect(q, "b", null));
        Assert.False(Grading.IsCorrect(q, null, null));
    }

    [Fact]
    public void MultipleChoice_RequiresExactSet()
    {
        var q = Multi("a", "b");
        Assert.True(Grading.IsCorrect(q, null, new() { "a", "b" }));
        Assert.True(Grading.IsCorrect(q, null, new() { "b", "a" }));   // Reihenfolge egal
        Assert.False(Grading.IsCorrect(q, null, new() { "a" }));        // unvollständig
        Assert.False(Grading.IsCorrect(q, null, new() { "a", "b", "c" })); // zu viel
    }

    [Theory]
    [InlineData(MobileQuestionType.OneChoice, true)]
    [InlineData(MobileQuestionType.MultipleChoice, true)]
    [InlineData(MobileQuestionType.TrueFalse, true)]
    [InlineData(MobileQuestionType.OwnAnswer, false)]
    [InlineData(MobileQuestionType.Code, false)]
    public void IsAutoGradable_ExcludesCodeAndOwnAnswer(MobileQuestionType type, bool expected) =>
        Assert.Equal(expected, Grading.IsAutoGradable(type));

    [Theory]
    [InlineData(0, 3, 0)]
    [InlineData(3, 3, 100)]
    [InlineData(2, 3, 67)]   // kaufmännisch gerundet
    [InlineData(1, 3, 33)]
    [InlineData(0, 0, 0)]    // leeres Quiz
    public void Percent_RoundsCorrectly(int correct, int total, int expected) =>
        Assert.Equal(expected, Grading.Percent(correct, total));
}

public class ChapterQuizMapperTests
{
    private static QuestionList Quiz() => new()
    {
        Questions = new()
        {
            new()
            {
                ElementId = "q1",
                QuestionType = MobileQuestionType.OneChoice,
                Answers = new()
                {
                    new() { Id = "a", IsCorrect = true,  Titel = new(), Comment = "richtig weil X" },
                    new() { Id = "b", IsCorrect = false, Titel = new(), Comment = "" },
                },
            },
        },
    };

    private static Chapter Chapter() => new()
    {
        Id = "ch1",
        PassThresholdPercent = 60,
        MaxAttempts = 3,
    };

    [Fact]
    public void LearnerView_HidesCorrectnessAndComment()
    {
        var dto = Mappers.ToChapterQuizDto(Quiz(), Chapter(), reveal: false,
            attemptsUsed: 1, bestPercent: 50, passed: false);

        var ans = dto.Questions.Single().Answers;
        Assert.All(ans, a => Assert.False(a.IsCorrect));      // keine Korrektheit für Lerner
        Assert.All(ans, a => Assert.Equal(string.Empty, a.Comment));
        Assert.Equal(60, dto.PassThresholdPercent);
        Assert.Equal(3, dto.MaxAttempts);
    }

    [Fact]
    public void AuthorView_RevealsCorrectnessAndComment()
    {
        var dto = Mappers.ToChapterQuizDto(Quiz(), Chapter(), reveal: true,
            attemptsUsed: 0, bestPercent: null, passed: false);

        var correct = dto.Questions.Single().Answers.Single(a => a.Id == "a");
        Assert.True(correct.IsCorrect);
        Assert.Equal("richtig weil X", correct.Comment);
    }

    [Fact]
    public void AttemptsExhausted_WhenUsedReachesMax()
    {
        var exhausted = Mappers.ToChapterQuizDto(Quiz(), Chapter(), false, attemptsUsed: 3, bestPercent: 40, passed: false);
        Assert.True(exhausted.AttemptsExhausted);

        var free = Mappers.ToChapterQuizDto(Quiz(), Chapter(), false, attemptsUsed: 2, bestPercent: 40, passed: false);
        Assert.False(free.AttemptsExhausted);
    }

    [Fact]
    public void Result_RevealsAnswersAndCarriesScore()
    {
        var dto = Mappers.ToChapterQuizResultDto(Quiz(), Chapter(), correctCount: 1, percent: 100,
            passed: true, attemptNo: 1, attemptsRemaining: 2);

        Assert.Equal(1, dto.CorrectCount);
        Assert.Equal(1, dto.TotalCount);
        Assert.Equal(100, dto.Percent);
        Assert.True(dto.Passed);
        Assert.True(dto.Questions.Single().Answers.Single(a => a.Id == "a").IsCorrect);
    }
}
