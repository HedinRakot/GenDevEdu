namespace DevEdu.Api.Services.Chat;

/// <summary>
/// Erzeugt Vektor-Embeddings für Texte. Anthropic bietet keine Embeddings-API,
/// daher wird für RAG unabhängig vom Chat-Provider Gemini genutzt.
/// </summary>
public interface IEmbeddingProvider
{
    bool IsConfigured { get; }

    /// <summary>Bettet die Texte ein (Reihenfolge bleibt erhalten).</summary>
    Task<IReadOnlyList<double[]>> EmbedAsync(IReadOnlyList<string> texts, CancellationToken ct);
}
