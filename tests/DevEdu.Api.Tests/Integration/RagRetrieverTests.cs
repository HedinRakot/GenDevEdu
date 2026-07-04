using DevEdu.Api.Models;
using DevEdu.Api.Services.Chat;
using Xunit;

namespace DevEdu.Api.Tests.Integration;

[Collection(IntegrationCollection.Name)]
public class RagRetrieverTests
{
    private readonly DevEduApiFactory _factory;

    public RagRetrieverTests(DevEduApiFactory factory) => _factory = factory;

    private sealed class ConstEmbedder : IEmbeddingProvider
    {
        private readonly double[] _v;
        private readonly bool _configured;
        public ConstEmbedder(double[] v, bool configured = true) { _v = v; _configured = configured; }
        public bool IsConfigured => _configured;
        public Task<IReadOnlyList<double[]>> EmbedAsync(IReadOnlyList<string> texts, CancellationToken ct)
            => Task.FromResult<IReadOnlyList<double[]>>(texts.Select(_ => _v).ToList());
    }

    private async Task<string> SeedEmbeddings()
    {
        var courseId = $"rag-{Guid.NewGuid():N}";
        await _factory.Db.CourseEmbeddings.InsertManyAsync(new[]
        {
            new CourseEmbedding { Id = $"{courseId}:a", CourseId = courseId, ChapterId = "ch1", Kind = "lesson", Title = "Schleifen", Text = "for/while", Vector = new[] { 1.0, 0.0, 0.0 } },
            new CourseEmbedding { Id = $"{courseId}:b", CourseId = courseId, ChapterId = "ch2", Kind = "lesson", Title = "Klassen", Text = "class", Vector = new[] { 0.0, 1.0, 0.0 } },
            new CourseEmbedding { Id = $"{courseId}:c", CourseId = courseId, ChapterId = "ch3", Kind = "lesson", Title = "Enums", Text = "enum", Vector = new[] { 0.0, 0.0, 1.0 } },
        });
        return courseId;
    }

    [Fact]
    public async Task Retrieve_ReturnsClosestPassageAndSources()
    {
        var courseId = await SeedEmbeddings();
        // Query-Vektor zeigt Richtung "Schleifen" [1,0,0].
        var retriever = new RagRetriever(_factory.Db, new ConstEmbedder(new[] { 1.0, 0.1, 0.0 }));

        var (context, sources) = await retriever.RetrieveAsync("Wie funktionieren Schleifen?", courseId, 2, CancellationToken.None);

        Assert.NotNull(context);
        Assert.Contains("Schleifen", context!);
        Assert.NotEmpty(sources);
        Assert.Equal("Schleifen", sources[0].Title);
    }

    [Fact]
    public async Task Retrieve_ReturnsEmpty_WhenEmbedderNotConfigured()
    {
        var courseId = await SeedEmbeddings();
        var retriever = new RagRetriever(_factory.Db, new ConstEmbedder(new[] { 1.0 }, configured: false));

        var (context, sources) = await retriever.RetrieveAsync("x", courseId, 2, CancellationToken.None);

        Assert.Null(context);
        Assert.Empty(sources);
    }

    [Fact]
    public async Task Retrieve_ReturnsEmpty_WhenNoEmbeddingsForCourse()
    {
        var retriever = new RagRetriever(_factory.Db, new ConstEmbedder(new[] { 1.0, 0.0, 0.0 }));
        var (context, sources) = await retriever.RetrieveAsync("x", $"empty-{Guid.NewGuid():N}", 2, CancellationToken.None);

        Assert.Null(context);
        Assert.Empty(sources);
    }
}
