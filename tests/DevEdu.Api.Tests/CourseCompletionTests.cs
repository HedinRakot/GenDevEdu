using DevEdu.Api.Models;
using DevEdu.Api.Services;
using Xunit;

namespace DevEdu.Api.Tests;

public class CourseCompletionTests
{
    private static Chapter Chapter(string id, int contentCount, bool withQuiz)
    {
        var ch = new Chapter { Id = id, ChapterQuizId = withQuiz ? $"{id}-qz" : null };
        for (int i = 0; i < contentCount; i++)
            ch.ChapterContent.Add(new ChapterContent { Id = $"{id}-c{i}", ElementId = $"{id}-c{i}" });
        return ch;
    }

    private static Course Course(params Chapter[] chapters)
    {
        var c = new Course { Id = "course" };
        c.Chapters.AddRange(chapters);
        return c;
    }

    [Fact]
    public void Chapter_WithoutQuiz_CompleteWhenAllContentDone()
    {
        var ch = Chapter("ch", 2, withQuiz: false);
        Assert.False(CourseCompletion.IsChapterComplete(ch, new HashSet<string> { "ch-c0" }, new HashSet<string>()));
        Assert.True(CourseCompletion.IsChapterComplete(ch, new HashSet<string> { "ch-c0", "ch-c1" }, new HashSet<string>()));
    }

    [Fact]
    public void Chapter_WithQuiz_NeedsContentAndQuizPass()
    {
        var ch = Chapter("ch", 1, withQuiz: true);
        var allContent = new HashSet<string> { "ch-c0" };
        Assert.False(CourseCompletion.IsChapterComplete(ch, allContent, new HashSet<string>()));        // Quiz fehlt
        Assert.True(CourseCompletion.IsChapterComplete(ch, allContent, new HashSet<string> { "ch" }));  // Inhalt + Quiz
    }

    [Fact]
    public void Course_CompleteOnlyWhenAllRelevantChaptersComplete()
    {
        var course = Course(Chapter("a", 1, withQuiz: false), Chapter("b", 1, withQuiz: true));
        var partial = new Progress
        {
            CompletedChapterContentIds = { "a-c0", "b-c0" },
            PassedChapterQuizIds = { },   // b-Quiz fehlt
        };
        Assert.False(CourseCompletion.IsCourseComplete(course, partial));

        var full = new Progress
        {
            CompletedChapterContentIds = { "a-c0", "b-c0" },
            PassedChapterQuizIds = { "b" },
        };
        Assert.True(CourseCompletion.IsCourseComplete(course, full));
    }

    [Fact]
    public void EmptyCourse_OrNoProgress_IsNotComplete()
    {
        Assert.False(CourseCompletion.IsCourseComplete(Course(), new Progress()));      // keine Kapitel
        Assert.False(CourseCompletion.IsCourseComplete(Course(Chapter("a", 1, false)), null)); // kein Fortschritt
    }

    [Fact]
    public void ChaptersWithoutContentOrQuiz_AreIgnored()
    {
        // Leeres Kapitel (kein Inhalt, kein Quiz) zählt nicht als „relevant".
        var course = Course(Chapter("a", 2, withQuiz: false), Chapter("empty", 0, withQuiz: false));
        var prog = new Progress { CompletedChapterContentIds = { "a-c0", "a-c1" } };
        Assert.True(CourseCompletion.IsCourseComplete(course, prog));
    }
}
