using System.Net.Http.Json;
using System.Runtime.CompilerServices;
using System.Text.Json;
using Microsoft.Extensions.Configuration;

namespace DevEdu.Api.Services.Chat;

/// <summary>
/// Google-Gemini-Provider über den REST-Streaming-Endpunkt (alt=sse).
/// Key/Model aus Chat:Gemini:ApiKey / Chat:Gemini:Model.
/// </summary>
public class GeminiChatProvider : IChatProvider
{
    private readonly HttpClient _http;
    private readonly string _apiKey;
    private readonly string _model;

    public GeminiChatProvider(HttpClient http, IConfiguration config)
    {
        _http = http;
        _apiKey = config["Chat:Gemini:ApiKey"] ?? string.Empty;
        _model = config["Chat:Gemini:Model"] is { Length: > 0 } m ? m : "gemini-2.5-flash";
    }

    public string Name => "gemini";
    public bool IsConfigured => !string.IsNullOrWhiteSpace(_apiKey);

    public async IAsyncEnumerable<string> StreamAsync(
        string systemPrompt, IReadOnlyList<ChatMessage> messages,
        [EnumeratorCancellation] CancellationToken ct)
    {
        var url = $"https://generativelanguage.googleapis.com/v1beta/models/{_model}:streamGenerateContent?alt=sse&key={_apiKey}";
        var body = new
        {
            system_instruction = new { parts = new[] { new { text = systemPrompt } } },
            contents = messages.Select(m => new
            {
                role = m.Role == "assistant" ? "model" : "user",
                parts = new[] { new { text = m.Content } },
            }).ToArray(),
        };

        using var req = new HttpRequestMessage(HttpMethod.Post, url) { Content = JsonContent.Create(body) };
        using var resp = await _http.SendAsync(req, HttpCompletionOption.ResponseHeadersRead, ct);
        resp.EnsureSuccessStatusCode();

        await using var stream = await resp.Content.ReadAsStreamAsync(ct);
        await foreach (var data in Sse.ReadDataLinesAsync(stream, ct))
        {
            var text = ExtractText(data);
            if (!string.IsNullOrEmpty(text)) yield return text;
        }
    }

    /// <summary>Zieht candidates[0].content.parts[*].text aus einem Gemini-SSE-Chunk.</summary>
    private static string? ExtractText(string json)
    {
        try
        {
            using var doc = JsonDocument.Parse(json);
            if (!doc.RootElement.TryGetProperty("candidates", out var cands) || cands.GetArrayLength() == 0)
                return null;
            if (!cands[0].TryGetProperty("content", out var content) ||
                !content.TryGetProperty("parts", out var parts))
                return null;

            var sb = new System.Text.StringBuilder();
            foreach (var part in parts.EnumerateArray())
                if (part.TryGetProperty("text", out var t)) sb.Append(t.GetString());
            return sb.ToString();
        }
        catch (JsonException)
        {
            return null;   // unvollständige/nicht-JSON-Zeile überspringen
        }
    }
}
