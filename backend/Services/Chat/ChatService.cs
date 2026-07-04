using Microsoft.Extensions.Configuration;

namespace DevEdu.Api.Services.Chat;

/// <summary>Ergebnis der Vorbereitung: gewählter Provider, fertiger System-Prompt, RAG-Quellen.</summary>
public record ChatPreparation(IChatProvider Provider, string SystemPrompt, IReadOnlyList<ChatSource> Sources);

/// <summary>
/// Orchestriert den Chat: wählt den (konfigurierten oder angeforderten) Provider und
/// baut den System-Prompt. Kontext-/RAG-Anreicherung folgt in B3/B5.
/// </summary>
public class ChatService
{
    private readonly IReadOnlyDictionary<string, IChatProvider> _providers;
    private readonly string _defaultProvider;
    private readonly ILogger<ChatService> _logger;
    private readonly ChatContextBuilder _contextBuilder;
    private readonly RagRetriever _retriever;

    public ChatService(
        IEnumerable<IChatProvider> providers, IConfiguration config,
        ILogger<ChatService> logger, ChatContextBuilder contextBuilder, RagRetriever retriever)
    {
        _providers = providers.ToDictionary(p => p.Name, StringComparer.OrdinalIgnoreCase);
        _defaultProvider = config["Chat:Provider"]?.Trim() is { Length: > 0 } p ? p : "gemini";
        _logger = logger;
        _contextBuilder = contextBuilder;
        _retriever = retriever;
    }

    /// <summary>Wählt den Provider (Request-Override &gt; Default). Nicht konfigurierte/unbekannte
    /// Namen fallen auf den Default bzw. den ersten einsatzbereiten Provider zurück.</summary>
    public IChatProvider ResolveProvider(string? requested)
    {
        var name = string.IsNullOrWhiteSpace(requested) ? _defaultProvider : requested.Trim();

        if (_providers.TryGetValue(name, out var chosen) && chosen.IsConfigured)
            return chosen;

        if (_providers.TryGetValue(_defaultProvider, out var def) && def.IsConfigured)
        {
            if (!string.Equals(name, _defaultProvider, StringComparison.OrdinalIgnoreCase))
                _logger.LogWarning("Chat provider '{Requested}' nicht verfügbar — nutze Default '{Default}'.", name, _defaultProvider);
            return def;
        }

        var firstReady = _providers.Values.FirstOrDefault(x => x.IsConfigured);
        if (firstReady is not null) return firstReady;

        throw new InvalidOperationException(
            "Kein Chat-Provider konfiguriert. Bitte Chat:Gemini:ApiKey (oder Chat:Anthropic:ApiKey) setzen.");
    }

    /// <summary>
    /// Wählt Provider, baut den System-Prompt (Basis + B3-Kurskontext + B5-RAG-Passagen)
    /// und liefert die genutzten Quellen. Das eigentliche Streaming macht der Aufrufer
    /// über <c>Provider.StreamAsync(SystemPrompt, messages)</c>.
    /// </summary>
    public async Task<ChatPreparation> PrepareAsync(ChatRequest request, string? userId, CancellationToken ct)
    {
        var provider = ResolveProvider(request.Provider);

        var parts = new List<string> { ChatPrompts.BaseTutor };

        var context = await _contextBuilder.BuildAsync(request.Context, userId, ct);
        if (!string.IsNullOrEmpty(context)) parts.Add(context);

        var lastUser = request.Messages.LastOrDefault(m => m.Role == "user")?.Content ?? string.Empty;
        var (rag, sources) = await _retriever.RetrieveAsync(lastUser, request.Context?.CourseId, 4, ct);
        if (!string.IsNullOrEmpty(rag)) parts.Add(rag);

        return new ChatPreparation(provider, string.Join("\n\n", parts), sources);
    }
}
