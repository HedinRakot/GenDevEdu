using System.Net;
using System.Net.Http.Json;
using Xunit;

namespace DevEdu.Api.Tests.Integration;

[Collection(IntegrationCollection.Name)]
public class ChatEndpointsTests
{
    private readonly HttpClient _client;

    public ChatEndpointsTests(DevEduApiFactory factory) => _client = factory.CreateClient();

    private static object Msg(string role, string content) => new { role, content };

    [Fact]
    public async Task Chat_Anonymous_Returns401()
    {
        var res = await _client.PostAsJsonAsync("/api/chat", new { messages = new[] { Msg("user", "Hi") } });
        Assert.Equal(HttpStatusCode.Unauthorized, res.StatusCode);
    }

    [Fact]
    public async Task Chat_EmptyMessages_Returns400()
    {
        var res = await _client.PostAsAsync("/api/chat", "chat-user", body: new { messages = Array.Empty<object>() });
        Assert.Equal(HttpStatusCode.BadRequest, res.StatusCode);
    }

    [Fact]
    public async Task Chat_StreamingResponse_CarriesCorsHeader()
    {
        var req = new HttpRequestMessage(HttpMethod.Post, "/api/chat");
        req.Headers.Add("X-Test-Sub", "chat-cors");
        req.Headers.Add("Origin", "http://localhost:8081");
        req.Content = System.Net.Http.Json.JsonContent.Create(new { messages = new[] { Msg("user", "Hi") } });

        var res = await _client.SendAsync(req);
        res.EnsureSuccessStatusCode();

        // Der Browser verlangt ACAO auch auf der eigentlichen (gestreamten) Antwort.
        Assert.True(res.Headers.Contains("Access-Control-Allow-Origin"),
            "Streaming-Antwort trägt kein Access-Control-Allow-Origin.");
    }

    [Fact]
    public async Task Reindex_NonAdmin_Returns403()
    {
        var res = await _client.PostAsAsync("/api/chat/reindex", "learner-x");
        Assert.Equal(HttpStatusCode.Forbidden, res.StatusCode);
    }

    [Fact]
    public async Task Reindex_Admin_WithoutEmbeddingKey_Returns503()
    {
        // Im Test ist kein Embedding-Key konfiguriert → Indexer nicht verfügbar.
        var res = await _client.PostAsAsync("/api/chat/reindex", "admin-x", "admin");
        Assert.Equal(HttpStatusCode.ServiceUnavailable, res.StatusCode);
    }

    [Fact]
    public async Task Chat_StreamsSseChunksAndDone()
    {
        var res = await _client.PostAsAsync("/api/chat", "chat-user",
            body: new { messages = new[] { Msg("user", "Erklär mir Schleifen") } });

        res.EnsureSuccessStatusCode();
        Assert.StartsWith("text/event-stream", res.Content.Headers.ContentType!.ToString());

        var body = await res.Content.ReadAsStringAsync();

        // Fake-Provider streamt "Hallo " + "Welt" als zwei data-Events, dann done.
        Assert.Contains("data: {\"delta\":\"Hallo \"}", body);
        Assert.Contains("data: {\"delta\":\"Welt\"}", body);
        Assert.Contains("data: {\"done\":true}", body);
    }
}
