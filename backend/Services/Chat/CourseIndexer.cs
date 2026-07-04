using System.Security.Cryptography;
using System.Text;
using DevEdu.Api.Models;
using MongoDB.Driver;

namespace DevEdu.Api.Services.Chat;

public record IndexResult(int Courses, int Embedded, int Reused, int Deleted);

/// <summary>
/// Baut/aktualisiert den RAG-Index (Collection courseembeddings). Inkrementell:
/// unveränderte Passagen (gleicher Hash) werden nicht neu eingebettet, entfernte
/// Passagen gelöscht. Idempotent — mehrfaches Ausführen erzeugt keine Duplikate.
/// </summary>
public class CourseIndexer
{
    private readonly MongoContext _db;
    private readonly IEmbeddingProvider _embedder;
    private readonly ILogger<CourseIndexer> _logger;

    public CourseIndexer(MongoContext db, IEmbeddingProvider embedder, ILogger<CourseIndexer> logger)
    {
        _db = db;
        _embedder = embedder;
        _logger = logger;
    }

    public bool IsAvailable => _embedder.IsConfigured;

    /// <summary>Indexiert alle Kurse. Wirft, wenn kein Embedding-Key konfiguriert ist.</summary>
    public async Task<IndexResult> ReindexAllAsync(CancellationToken ct)
    {
        if (!_embedder.IsConfigured)
            throw new InvalidOperationException("Kein Embedding-Key konfiguriert (Chat:Gemini:ApiKey).");

        var courses = await _db.Courses.Find(FilterDefinition<Course>.Empty).ToListAsync(ct);
        int embedded = 0, reused = 0, deleted = 0;
        foreach (var course in courses)
        {
            var r = await IndexCourseAsync(course, ct);
            embedded += r.Embedded; reused += r.Reused; deleted += r.Deleted;
        }
        _logger.LogInformation("RAG reindex: {Courses} Kurse, {Embedded} neu, {Reused} unverändert, {Deleted} entfernt.",
            courses.Count, embedded, reused, deleted);
        return new IndexResult(courses.Count, embedded, reused, deleted);
    }

    public async Task<IndexResult> IndexCourseAsync(Course course, CancellationToken ct)
    {
        var questionLists = await _db.QuestionLists.Find(q => q.CourseId == course.Id).ToListAsync(ct);
        var passages = CourseChunker.Chunk(course, questionLists);

        var existing = await _db.CourseEmbeddings.Find(e => e.CourseId == course.Id).ToListAsync(ct);
        var existingById = existing.ToDictionary(e => e.Id);

        var keep = new HashSet<string>();
        var toEmbed = new List<(string Id, CoursePassage P, string Hash)>();

        var reused = 0;
        foreach (var p in passages)
        {
            var id = $"{course.Id}:{p.SourceId}:{p.ChunkIndex}";
            keep.Add(id);
            var hash = Sha256(p.Text);
            if (existingById.TryGetValue(id, out var e) && e.Hash == hash) { reused++; continue; }
            toEmbed.Add((id, p, hash));
        }

        if (toEmbed.Count > 0)
        {
            var vectors = await _embedder.EmbedAsync(toEmbed.Select(x => x.P.Text).ToList(), ct);
            for (var i = 0; i < toEmbed.Count; i++)
            {
                var (id, p, hash) = toEmbed[i];
                var doc = new CourseEmbedding
                {
                    Id = id,
                    CourseId = course.Id,
                    ChapterId = p.ChapterId,
                    SourceId = p.SourceId,
                    Kind = p.Kind,
                    Title = p.Title,
                    Text = p.Text,
                    Hash = hash,
                    Vector = vectors[i],
                    UpdatedAt = DateTime.UtcNow,
                };
                await _db.CourseEmbeddings.ReplaceOneAsync(
                    x => x.Id == id, doc, new ReplaceOptions { IsUpsert = true }, ct);
            }
        }

        var stale = existing.Where(e => !keep.Contains(e.Id)).Select(e => e.Id).ToList();
        if (stale.Count > 0)
            await _db.CourseEmbeddings.DeleteManyAsync(e => stale.Contains(e.Id), ct);

        return new IndexResult(1, toEmbed.Count, reused, stale.Count);
    }

    private static string Sha256(string s)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(s));
        return Convert.ToHexString(bytes);
    }
}
