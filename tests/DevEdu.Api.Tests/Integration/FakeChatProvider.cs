using System.Runtime.CompilerServices;
using DevEdu.Api.Services.Chat;

namespace DevEdu.Api.Tests.Integration;

/// <summary>
/// Deterministischer Chat-Provider für Integrationstests — kein echter LLM-Call.
/// Streamt zwei feste Chunks; Name "gemini" = Default-Provider.
/// </summary>
public class FakeChatProvider : IChatProvider
{
    public string Name => "gemini";
    public bool IsConfigured => true;

    public async IAsyncEnumerable<string> StreamAsync(
        string systemPrompt, IReadOnlyList<ChatMessage> messages,
        [EnumeratorCancellation] CancellationToken ct)
    {
        yield return "Hallo ";
        yield return "Welt";
        await Task.CompletedTask;
    }
}
