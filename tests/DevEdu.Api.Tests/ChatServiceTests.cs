using DevEdu.Api.Services;
using DevEdu.Api.Services.Chat;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;

namespace DevEdu.Api.Tests;

public class ChatServiceTests
{
    private sealed class StubProvider : IChatProvider
    {
        public StubProvider(string name, bool configured) { Name = name; IsConfigured = configured; }
        public string Name { get; }
        public bool IsConfigured { get; }
        public async IAsyncEnumerable<string> StreamAsync(
            string systemPrompt, IReadOnlyList<ChatMessage> messages,
            [System.Runtime.CompilerServices.EnumeratorCancellation] CancellationToken ct)
        { yield return Name; await Task.CompletedTask; }
    }

    private sealed class UnconfiguredEmbedder : IEmbeddingProvider
    {
        public bool IsConfigured => false;
        public Task<IReadOnlyList<double[]>> EmbedAsync(IReadOnlyList<string> texts, CancellationToken ct)
            => Task.FromResult<IReadOnlyList<double[]>>(Array.Empty<double[]>());
    }

    private static ChatService Build(string? provider, params IChatProvider[] providers)
    {
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?> { ["Chat:Provider"] = provider })
            .Build();
        // MongoContext verbindet erst bei einer Query; ResolveProvider nutzt weder
        // Context-Builder noch Retriever, daher genügen unverbundene Instanzen.
        var db = new MongoContext(new MongoOptions());
        var contextBuilder = new ChatContextBuilder(db);
        var retriever = new RagRetriever(db, new UnconfiguredEmbedder());
        return new ChatService(providers, config, NullLogger<ChatService>.Instance, contextBuilder, retriever);
    }

    [Fact]
    public void Resolves_DefaultProvider_WhenNoOverride()
    {
        var svc = Build("gemini", new StubProvider("gemini", true), new StubProvider("claude", true));
        Assert.Equal("gemini", svc.ResolveProvider(null).Name);
    }

    [Fact]
    public void Resolves_RequestedOverride_WhenConfigured()
    {
        var svc = Build("gemini", new StubProvider("gemini", true), new StubProvider("claude", true));
        Assert.Equal("claude", svc.ResolveProvider("claude").Name);
    }

    [Fact]
    public void FallsBackToDefault_WhenRequestedProviderNotConfigured()
    {
        // claude ohne Key (IsConfigured=false) → Default gemini.
        var svc = Build("gemini", new StubProvider("gemini", true), new StubProvider("claude", false));
        Assert.Equal("gemini", svc.ResolveProvider("claude").Name);
    }

    [Fact]
    public void FallsBackToDefault_WhenRequestedProviderUnknown()
    {
        var svc = Build("gemini", new StubProvider("gemini", true));
        Assert.Equal("gemini", svc.ResolveProvider("does-not-exist").Name);
    }

    [Fact]
    public void FallsBackToAnyConfigured_WhenDefaultUnavailable()
    {
        // Default "gemini" nicht konfiguriert, aber claude schon → claude.
        var svc = Build("gemini", new StubProvider("gemini", false), new StubProvider("claude", true));
        Assert.Equal("claude", svc.ResolveProvider(null).Name);
    }

    [Fact]
    public void Throws_WhenNoProviderConfigured()
    {
        var svc = Build("gemini", new StubProvider("gemini", false), new StubProvider("claude", false));
        Assert.Throws<InvalidOperationException>(() => svc.ResolveProvider(null));
    }
}
