using DevEdu.Api.Models;
using MongoDB.Driver;

namespace DevEdu.Api.Services.Chat;

/// <summary>Eine für den Lerner sichtbare Quelle einer RAG-Antwort.</summary>
public record ChatSource(string Title, string Kind, string ChapterId, string CourseId);

/// <summary>
/// Holt zur Anfrage passende Kurs-Passagen aus dem Index: Query einbetten,
/// In-Memory-Cosine-Top-k über <see cref="CourseEmbedding"/>, als Kontext + Quellen
/// zurückgeben. Ohne Embedding-Key oder ohne Index liefert es leer (kein RAG).
/// </summary>
public class RagRetriever
{
    private static readonly IReadOnlyList<ChatSource> None = Array.Empty<ChatSource>();

    private readonly MongoContext _db;
    private readonly IEmbeddingProvider _embedder;

    public RagRetriever(MongoContext db, IEmbeddingProvider embedder)
    {
        _db = db;
        _embedder = embedder;
    }

    public async Task<(string? Context, IReadOnlyList<ChatSource> Sources)> RetrieveAsync(
        string query, string? courseId, int k, CancellationToken ct)
    {
        if (!_embedder.IsConfigured || string.IsNullOrWhiteSpace(query)) return (null, None);

        var filter = string.IsNullOrEmpty(courseId)
            ? FilterDefinition<CourseEmbedding>.Empty
            : Builders<CourseEmbedding>.Filter.Eq(e => e.CourseId, courseId);
        var docs = await _db.CourseEmbeddings.Find(filter).ToListAsync(ct);
        if (docs.Count == 0) return (null, None);

        var queryVec = (await _embedder.EmbedAsync(new[] { query }, ct))[0];
        var top = CosineRetriever.TopK(queryVec, docs, k).Where(x => x.Score > 0).ToList();
        if (top.Count == 0) return (null, None);

        var sb = new System.Text.StringBuilder(
            "=== Relevante Kursauszüge (nutze sie, wenn passend; nenne die Quelle) ===\n");
        for (var i = 0; i < top.Count; i++)
        {
            var d = top[i].Doc;
            sb.Append('[').Append(i + 1).Append("] ").Append(d.Title).Append(": ").Append(d.Text).Append('\n');
        }

        var sources = top
            .Select(x => new ChatSource(x.Doc.Title, x.Doc.Kind, x.Doc.ChapterId, x.Doc.CourseId))
            .GroupBy(s => s.Title + "|" + s.ChapterId)
            .Select(g => g.First())
            .ToList();

        return (sb.ToString(), sources);
    }
}
