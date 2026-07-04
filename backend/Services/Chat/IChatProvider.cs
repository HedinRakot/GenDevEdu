namespace DevEdu.Api.Services.Chat;

/// <summary>
/// Austauschbarer Chat-LLM-Anbieter. Implementierungen streamen die Antwort als
/// Text-Chunks. Naht für umschaltbare Provider (Gemini jetzt; Claude sobald ein
/// Anthropic-Key hinterlegt ist).
/// </summary>
public interface IChatProvider
{
    /// <summary>Eindeutiger Name, über den <see cref="ChatService"/> auswählt (z. B. "gemini", "claude").</summary>
    string Name { get; }

    /// <summary>True, wenn der Provider einsatzbereit ist (z. B. API-Key konfiguriert).</summary>
    bool IsConfigured { get; }

    /// <summary>Streamt die Assistenz-Antwort als Text-Chunks.</summary>
    IAsyncEnumerable<string> StreamAsync(
        string systemPrompt,
        IReadOnlyList<ChatMessage> messages,
        CancellationToken ct);
}
