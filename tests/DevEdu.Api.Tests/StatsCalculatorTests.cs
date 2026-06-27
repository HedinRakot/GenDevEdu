using DevEdu.Api.Models;
using DevEdu.Api.Services;
using Xunit;

namespace DevEdu.Api.Tests;

public class StatsCalculatorTests
{
    // Kurs mit 4 Content-Items; `quizChapter` bekommt ein Abschlussquiz.
    private static Course Course(string id, string name, int contentCount, bool withQuiz)
    {
        var chapter = new Chapter { Id = $"{id}-ch", ChapterQuizId = withQuiz ? $"{id}-qz" : null };
        for (int i = 0; i < contentCount; i++)
            chapter.ChapterContent.Add(new ChapterContent { Id = $"{id}-c{i}", ElementId = $"{id}-c{i}" });
        return new Course
        {
            Id = id,
            Titel = new Texte { Items = { new TextItem { Text = name, Language = 1 } } },
            Chapters = { chapter },
        };
    }

    [Fact]
    public void PerCourseProgress_UsesIntersection_IgnoresStaleIds()
    {
        var course = Course("c1", "Kurs 1", contentCount: 4, withQuiz: true);
        var progress = new Progress
        {
            CourseId = "c1",
            CompletedChapterContentIds = { "c1-c0", "c1-c1", "stale-id" }, // stale wird ignoriert
            PassedChapterQuizIds = { "c1-ch" },
        };

        var dto = StatsCalculator.Build(
            new() { course }, new(), new() { progress }, new(), new(), new());

        var cs = Assert.Single(dto.Courses);
        Assert.Equal(2, cs.CompletedContent);
        Assert.Equal(4, cs.TotalContent);
        Assert.Equal(50, cs.ProgressPercent);
        Assert.Equal(1, cs.ChaptersPassed);
        Assert.Equal(1, cs.TotalChapters);
        Assert.False(cs.Completed);          // Inhalte noch nicht fertig
        Assert.Equal(1, dto.ActiveCourses);
        Assert.Equal(0, dto.CompletedCourses);
        Assert.Equal(50, dto.OverallProgressPercent);
    }

    [Fact]
    public void Course_Completed_WhenAllContentDoneAndQuizPassed()
    {
        var course = Course("c1", "Kurs 1", contentCount: 2, withQuiz: true);
        var progress = new Progress
        {
            CourseId = "c1",
            CompletedChapterContentIds = { "c1-c0", "c1-c1" },
            PassedChapterQuizIds = { "c1-ch" },
        };

        var dto = StatsCalculator.Build(new() { course }, new(), new() { progress }, new(), new(), new());

        Assert.True(dto.Courses.Single().Completed);
        Assert.Equal(1, dto.CompletedCourses);
        Assert.Equal(0, dto.ActiveCourses);
        Assert.Equal(100, dto.OverallProgressPercent);
    }

    [Fact]
    public void OverallProgress_RollsUpAcrossCourses()
    {
        var c1 = Course("c1", "K1", 4, false); // 2/4
        var c2 = Course("c2", "K2", 4, false); // 4/4
        var p1 = new Progress { CourseId = "c1", CompletedChapterContentIds = { "c1-c0", "c1-c1" } };
        var p2 = new Progress { CourseId = "c2", CompletedChapterContentIds = { "c2-c0", "c2-c1", "c2-c2", "c2-c3" } };

        var dto = StatsCalculator.Build(new() { c1, c2 }, new(), new() { p1, p2 }, new(), new(), new());

        Assert.Equal(75, dto.OverallProgressPercent); // 6 von 8
    }

    [Fact]
    public void QuizAccuracy_CountsCorrectOverTotal()
    {
        var attempts = new List<Attempt>
        {
            new() { IsCorrect = true }, new() { IsCorrect = true }, new() { IsCorrect = true },
            new() { IsCorrect = false }, new() { IsCorrect = false },
        };
        var dto = StatsCalculator.Build(new(), new(), new(), attempts, new(), new());

        Assert.Equal(3, dto.CorrectAnswered);
        Assert.Equal(5, dto.TotalAnswered);
        Assert.Equal(60, dto.QuizAccuracyPercent);
    }

    [Fact]
    public void ChapterQuizzes_CountDistinctChapters()
    {
        var qa = new List<ChapterQuizAttempt>
        {
            new() { ChapterId = "chA", Passed = false },
            new() { ChapterId = "chA", Passed = true },  // gleiches Kapitel, jetzt bestanden
            new() { ChapterId = "chB", Passed = false },
        };
        var dto = StatsCalculator.Build(new(), new(), new(), new(), qa, new());

        Assert.Equal(2, dto.ChapterQuizzesTaken);   // chA, chB
        Assert.Equal(1, dto.ChapterQuizzesPassed);  // nur chA bestanden
    }

    [Fact]
    public void CodeTasks_CountDistinctQuestions()
    {
        var subs = new List<CodeSubmission>
        {
            new() { QuestionId = "q1", Outcome = CodeRunOutcome.Failed },
            new() { QuestionId = "q1", Outcome = CodeRunOutcome.Passed },  // q1 gelöst
            new() { QuestionId = "q2", Outcome = CodeRunOutcome.Failed },  // q2 nur versucht
        };
        var dto = StatsCalculator.Build(new(), new(), new(), new(), new(), subs);

        Assert.Equal(2, dto.CodeTasksAttempted); // q1, q2
        Assert.Equal(1, dto.CodeTasksSolved);    // q1
    }

    [Fact]
    public void EmptyInputs_YieldZeros()
    {
        var dto = StatsCalculator.Build(new(), new(), new(), new(), new(), new());

        Assert.Empty(dto.Courses);
        Assert.Equal(0, dto.ActiveCourses);
        Assert.Equal(0, dto.OverallProgressPercent);
        Assert.Equal(0, dto.QuizAccuracyPercent);
        Assert.Equal(0, dto.CodeTasksSolved);
    }
}
