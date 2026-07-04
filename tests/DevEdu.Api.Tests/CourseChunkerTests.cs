using DevEdu.Api.Models;
using DevEdu.Api.Services.Chat;
using Xunit;

namespace DevEdu.Api.Tests;

public class CourseChunkerTests
{
    private static Texte De(string text) => new() { Items = { new TextItem { Text = text, Language = 1 } } };

    [Fact]
    public void Chunk_ProducesLessonChunksAndQuestionPassages()
    {
        var para = new string('a', 400);
        var lessonText = string.Join("\n\n", para, para, para);   // 3 Absätze à 400 → mehrere Chunks

        var content = new ChapterContent { Id = "cc1", ElementId = "cc1", Titel = De("Schleifen"), LessonTexte = De(lessonText) };
        var chapter = new Chapter { Id = "ch1", ElementId = "ch1", Titel = De("Kontrollfluss"), ChapterContent = { content } };
        var course = new Course { Id = "c1", Chapters = { chapter } };

        var ql = new QuestionList
        {
            CourseId = "c1",
            ChapterId = "ch1",
            Questions = { new Question { Id = "q1", ElementId = "q1", Titel = De("Was macht break?") } },
        };

        var passages = CourseChunker.Chunk(course, new[] { ql });

        var lessons = passages.Where(p => p.Kind == "lesson").ToList();
        var questions = passages.Where(p => p.Kind == "question").ToList();

        Assert.True(lessons.Count >= 2, "langer Lektionstext sollte in mehrere Chunks zerlegt werden");
        Assert.All(lessons, p => Assert.Equal("cc1", p.SourceId));
        Assert.Equal(new[] { 0, 1 }, lessons.Take(2).Select(p => p.ChunkIndex).ToArray());

        var q = Assert.Single(questions);
        Assert.Equal("q1", q.SourceId);
        Assert.Equal("Was macht break?", q.Text);
    }

    [Fact]
    public void Chunk_SkipsEmptyLessons()
    {
        var content = new ChapterContent { Id = "cc1", Titel = De("Leer"), LessonTexte = new Texte() };
        var chapter = new Chapter { Id = "ch1", ChapterContent = { content } };
        var course = new Course { Id = "c1", Chapters = { chapter } };

        var passages = CourseChunker.Chunk(course, System.Array.Empty<QuestionList>());
        Assert.Empty(passages);
    }
}
