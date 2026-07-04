using System.Runtime.CompilerServices;

namespace DevEdu.Api.Services.Chat;

/// <summary>Liest eine Server-Sent-Events-Antwort zeilenweise und liefert die
/// `data:`-Payloads (roher JSON-String je Event). Für Gemini (alt=sse) und Claude.</summary>
public static class Sse
{
    public static async IAsyncEnumerable<string> ReadDataLinesAsync(
        Stream stream, [EnumeratorCancellation] CancellationToken ct)
    {
        using var reader = new StreamReader(stream);
        string? line;
        while ((line = await reader.ReadLineAsync(ct)) is not null)
        {
            if (line.Length == 0) continue;
            if (!line.StartsWith("data:", StringComparison.Ordinal)) continue;
            var payload = line[5..].TrimStart();
            if (payload.Length > 0) yield return payload;
        }
    }
}
