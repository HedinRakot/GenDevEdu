using DevEdu.Api.Models;
using DevEdu.Api.Services.Chat;
using Microsoft.Extensions.Logging.Abstractions;
using MongoDB.Driver;
using Xunit;

namespace DevEdu.Api.Tests.Integration;

[Collection(IntegrationCollection.Name)]
public class CourseIndexerTests
{
    private readonly DevEduApiFactory _factory;

    public CourseIndexerTests(DevEduApiFactory factory) => _factory = factory;

    private sealed class FakeEmbeddingProvider : IEmbeddingProvider
    {
        public int TotalEmbedded { get; private set; }
        public bool IsConfigured => true;
        public Task<IReadOnlyList<double[]>> EmbedAsync(IReadOnlyList<string> texts, CancellationToken ct)
        {
            TotalEmbedded += texts.Count;
            IReadOnlyList<double[]> vecs = texts.Select(t => new double[] { t.Length, 1.0, 0.0 }).ToList();
            return Task.FromResult(vecs);
        }
    }

    private static Texte De(string text) => new() { Items = { new TextItem { Text = text, Language = 1 } } };

    private async Task<(Course course, string contentId)> SeedCourse()
    {
        var courseId = $"idx-course-{Guid.NewGuid():N}";
        var contentId = $"idx-cc-{Guid.NewGuid():N}";
        var content = new ChapterContent { Id = contentId, ElementId = contentId, Titel = De("Schleifen"), LessonTexte = De("Eine for-Schleife wiederholt Code.") };
        var chapter = new Chapter { Id = $"idx-ch-{Guid.NewGuid():N}", Titel = De("Kontrollfluss"), ChapterContent = { content } };
        var course = new Course { Id = courseId, Titel = De("C# Grundlagen"), Chapters = { chapter } };
        await _factory.Db.Courses.InsertOneAsync(course);

        var ql = new QuestionList
        {
            CourseId = courseId,
            Questions = { new Question { Id = $"idx-q-{Guid.NewGuid():N}", Titel = De("Was macht continue?") } },
        };
        await _factory.Db.QuestionLists.InsertOneAsync(ql);
        return (course, contentId);
    }

    [Fact]
    public async Task Index_PersistsEmbeddings_AndIsIncrementalOnRerun()
    {
        var (course, contentId) = await SeedCourse();
        var fake = new FakeEmbeddingProvider();
        var indexer = new CourseIndexer(_factory.Db, fake, NullLogger<CourseIndexer>.Instance);

        var first = await indexer.IndexCourseAsync(course, CancellationToken.None);
        Assert.True(first.Embedded >= 2);          // ≥1 Lektion + 1 Frage
        Assert.Equal(0, first.Reused);

        var stored = await _factory.Db.CourseEmbeddings.Find(e => e.CourseId == course.Id).ToListAsync();
        Assert.Equal(first.Embedded, stored.Count);
        Assert.All(stored, e => Assert.Equal(3, e.Vector.Length));

        var embeddedAfterFirst = fake.TotalEmbedded;

        // Zweiter Lauf: nichts geändert → nichts neu eingebettet, alles wiederverwendet.
        var second = await indexer.IndexCourseAsync(course, CancellationToken.None);
        Assert.Equal(0, second.Embedded);
        Assert.Equal(first.Embedded, second.Reused);
        Assert.Equal(embeddedAfterFirst, fake.TotalEmbedded);   // keine neuen Embed-Calls

        // Keine Duplikate.
        var countAfter = await _factory.Db.CourseEmbeddings.CountDocumentsAsync(e => e.CourseId == course.Id);
        Assert.Equal(first.Embedded, countAfter);
    }

    [Fact]
    public async Task Index_ReembedsOnlyChangedPassage()
    {
        var (course, contentId) = await SeedCourse();
        var fake = new FakeEmbeddingProvider();
        var indexer = new CourseIndexer(_factory.Db, fake, NullLogger<CourseIndexer>.Instance);
        await indexer.IndexCourseAsync(course, CancellationToken.None);
        var before = fake.TotalEmbedded;

        // Lektionstext ändern → nur diese eine Passage muss neu eingebettet werden.
        var chapter = course.Chapters[0];
        chapter.ChapterContent[0].LessonTexte = De("Eine while-Schleife prüft die Bedingung vorher.");

        var r = await indexer.IndexCourseAsync(course, CancellationToken.None);
        Assert.Equal(1, r.Embedded);
        Assert.Equal(before + 1, fake.TotalEmbedded);
    }
}
