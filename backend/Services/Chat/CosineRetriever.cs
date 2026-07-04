using DevEdu.Api.Models;

namespace DevEdu.Api.Services.Chat;

/// <summary>Reine Top-k-Ähnlichkeitssuche über Cosine-Distanz (kein DB-/Netzzugriff).</summary>
public static class CosineRetriever
{
    public static IReadOnlyList<(CourseEmbedding Doc, double Score)> TopK(
        double[] query, IReadOnlyList<CourseEmbedding> docs, int k)
    {
        return docs
            .Select(d => (Doc: d, Score: Cosine(query, d.Vector)))
            .OrderByDescending(x => x.Score)
            .Take(k)
            .ToList();
    }

    public static double Cosine(double[] a, double[] b)
    {
        if (a.Length == 0 || b.Length == 0 || a.Length != b.Length) return 0;
        double dot = 0, na = 0, nb = 0;
        for (var i = 0; i < a.Length; i++)
        {
            dot += a[i] * b[i];
            na += a[i] * a[i];
            nb += b[i] * b[i];
        }
        if (na == 0 || nb == 0) return 0;
        return dot / (Math.Sqrt(na) * Math.Sqrt(nb));
    }
}
