using System.Net.Http.Json;
using System.Runtime.CompilerServices;
using System.Text.Json;
using Microsoft.Extensions.Configuration;

namespace DevEdu.Api.Services.Chat;

/// <summary>
/// Anthropic-Claude-Provider über die Messages-API (stream=true, SSE).
/// Key/Model aus Chat:Anthropic:ApiKey / Chat:Anthropic:Model. Solange kein Key
/// hinterlegt ist, meldet IsConfigured=false und der Provider wird nie ausgewählt.
/// </summary>
public class ClaudeChatProvider : IChatProvider
{
    private const string ApiVersion = "2023-06-01";

    private readonly HttpClient _http;
    private readonly string _apiKey;
    private readonly string _model;
    private readonly int _maxTokens;

    public ClaudeChatProvider(HttpClient http, IConfiguration config)
    {
        _http = http;
        _apiKey = config["Chat:Anthropic:ApiKey"] ?? string.Empty;
        _model = config["Chat:Anthropic:Model"] is { Length: > 0 } m ? m : "claude-sonnet-4-6";
        _maxTokens = int.TryParse(config["Chat:Anthropic:MaxTokens"], out var mt) ? mt : 1024;
    }

    public string Name => "claude";
    public bool IsConfigured => !string.IsNullOrWhiteSpace(_apiKey);

    public async IAsyncEnumerable<string> StreamAsync(
        string systemPrompt, IReadOnlyList<ChatMessage> messages,
        [EnumeratorCancellation] CancellationToken ct)
    {
        var body = new
        {
            model = _model,
            max_tokens = _maxTokens,
            system = systemPrompt,
            stream = true,
            messages = messages.Select(m => new
            {
                role = m.Role == "assistant" ? "assistant" : "user",
                content = m.Content,
            }).ToArray(),
        };

        using var req = new HttpRequestMessage(HttpMethod.Post, "https://api.anthropic.com/v1/messages")
        {
            Content = JsonContent.Create(body),
        };
        req.Headers.Add("x-api-key", _apiKey);
        req.Headers.Add("anthropic-version", ApiVersion);

        using var resp = await _http.SendAsync(req, HttpCompletionOption.ResponseHeadersRead, ct);
        resp.EnsureSuccessStatusCode();

        await using var stream = await resp.Content.ReadAsStreamAsync(ct);
        await foreach (var data in Sse.ReadDataLinesAsync(stream, ct))
        {
            var text = ExtractDeltaText(data);
            if (!string.IsNullOrEmpty(text)) yield return text;
        }
    }

    /// <summary>Zieht delta.text aus einem content_block_delta-Event; ignoriert andere Events.</summary>
    private static string? ExtractDeltaText(string json)
    {
        try
        {
            using var doc = JsonDocument.Parse(json);
            var root = doc.RootElement;
            if (!root.TryGetProperty("type", out var type) || type.GetString() != "content_block_delta")
                return null;
            if (!root.TryGetProperty("delta", out var delta) || !delta.TryGetProperty("text", out var t))
                return null;
            return t.GetString();
        }
        catch (JsonException)
        {
            return null;
        }
    }
}
