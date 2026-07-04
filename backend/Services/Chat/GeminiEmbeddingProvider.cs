using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Extensions.Configuration;

namespace DevEdu.Api.Services.Chat;

/// <summary>
/// Gemini-Embeddings über batchEmbedContents (Batches à max. 100). Key aus
/// Chat:Gemini:ApiKey, Modell aus Chat:Embedding:Model (Default text-embedding-004).
/// </summary>
public class GeminiEmbeddingProvider : IEmbeddingProvider
{
    private const int BatchSize = 100;

    private readonly HttpClient _http;
    private readonly string _apiKey;
    private readonly string _model;

    public GeminiEmbeddingProvider(HttpClient http, IConfiguration config)
    {
        _http = http;
        _apiKey = config["Chat:Gemini:ApiKey"] ?? string.Empty;
        _model = config["Chat:Embedding:Model"] is { Length: > 0 } m ? m : "text-embedding-004";
    }

    public bool IsConfigured => !string.IsNullOrWhiteSpace(_apiKey);

    public async Task<IReadOnlyList<double[]>> EmbedAsync(IReadOnlyList<string> texts, CancellationToken ct)
    {
        var result = new List<double[]>(texts.Count);
        for (var offset = 0; offset < texts.Count; offset += BatchSize)
        {
            var batch = texts.Skip(offset).Take(BatchSize).ToList();
            var url = $"https://generativelanguage.googleapis.com/v1beta/models/{_model}:batchEmbedContents?key={_apiKey}";
            var body = new
            {
                requests = batch.Select(t => new
                {
                    model = $"models/{_model}",
                    content = new { parts = new[] { new { text = t } } },
                }).ToArray(),
            };

            using var resp = await _http.PostAsJsonAsync(url, body, ct);
            resp.EnsureSuccessStatusCode();

            using var doc = JsonDocument.Parse(await resp.Content.ReadAsStringAsync(ct));
            var embeddings = doc.RootElement.GetProperty("embeddings");
            foreach (var emb in embeddings.EnumerateArray())
            {
                var values = emb.GetProperty("values");
                var vec = new double[values.GetArrayLength()];
                var i = 0;
                foreach (var v in values.EnumerateArray()) vec[i++] = v.GetDouble();
                result.Add(vec);
            }
        }
        return result;
    }
}
