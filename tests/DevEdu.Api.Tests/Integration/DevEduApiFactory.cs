using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Security.Claims;
using System.Text.Encodings.Web;
using DevEdu.Api.Models;
using DevEdu.Api.Services;
using DevEdu.Api.Services.CodeExecution;
using EphemeralMongo;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Xunit;

namespace DevEdu.Api.Tests.Integration;

/// <summary>
/// Bootet die echte Minimal-API (Program) gegen ein wegwerfbares Mongo (EphemeralMongo)
/// und ersetzt im Test nur (a) die Authentifizierung durch ein Header-gesteuertes
/// Test-Scheme und (b) den Podman-Sandbox-Runner durch ein deterministisches Fake.
/// Die echte ClerkRoleClaimsTransformation bleibt aktiv (role → ClaimTypes.Role),
/// damit Learner/Author/Admin-Pfade exakt wie in Produktion durchlaufen werden.
///
/// Eine Instanz (ein mongod-Prozess, eine geseedete DB) wird über die
/// xUnit-Collection geteilt — Tests isolieren sich über eindeutige User-IDs und
/// eindeutige Kurs-/Ressourcennamen.
/// </summary>
public class DevEduApiFactory : WebApplicationFactory<Program>
{
    private readonly IMongoRunner _mongo;

    /// <summary>Roh-Schlüssel für die Svix-Webhook-Signatur (32 Byte).</summary>
    public static readonly byte[] WebhookKey =
        System.Text.Encoding.UTF8.GetBytes("test-clerk-webhook-secret-key-32");

    /// <summary>Konfigurierter Webhook-Secret-Wert (whsec_-Präfix + base64).</summary>
    public static string WebhookSecret => "whsec_" + Convert.ToBase64String(WebhookKey);

    public DevEduApiFactory()
    {
        _mongo = MongoRunner.Run(new MongoRunnerOptions { UseSingleNodeReplicaSet = false });

        // WICHTIG: Beim Minimal-Hosting liest Program die Mongo-Konfiguration aus
        // builder.Configuration, BEVOR die ConfigureAppConfiguration-Callbacks der
        // Factory greifen. Umgebungsvariablen (Mongo__*) sind Teil der Default-
        // Konfiguration und werden rechtzeitig gelesen — daher hier setzen.
        Environment.SetEnvironmentVariable("Mongo__ConnectionString", _mongo.ConnectionString);
        Environment.SetEnvironmentVariable("Mongo__Database", "devedu_test");
        // Platzhalter — das Test-Scheme ersetzt die JWT-Validierung, die Clerk-
        // Authority wird daher nie kontaktiert.
        Environment.SetEnvironmentVariable("Clerk__Authority", "https://test.clerk.local");
        // Webhook-Signatur im Test scharf schalten (statt Dev-Skip bei leerem Secret).
        Environment.SetEnvironmentVariable("Clerk__WebhookSecret", WebhookSecret);
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.ConfigureTestServices(services =>
        {
            // (a) Auth: Test-Scheme als Default; das echte "Bearer"-Scheme bleibt
            // registriert, wird aber nicht mehr als Default genutzt.
            services.AddAuthentication(TestAuthHandler.SchemeName)
                .AddScheme<AuthenticationSchemeOptions, TestAuthHandler>(TestAuthHandler.SchemeName, _ => { });

            // (b) Sandbox: kein Podman im Test — deterministisches Fake.
            services.RemoveAll<ISandboxRunner>();
            services.AddSingleton<ISandboxRunner, FakeSandboxRunner>();

            // (c) Chat: kein echter LLM-Call — deterministisches Fake (Name "gemini"
            // = Default-Provider, damit ChatService es ohne Config-Override wählt).
            services.RemoveAll<DevEdu.Api.Services.Chat.IChatProvider>();
            services.AddSingleton<DevEdu.Api.Services.Chat.IChatProvider, FakeChatProvider>();
        });

        builder.ConfigureLogging(l => l.SetMinimumLevel(LogLevel.Warning));
    }

    /// <summary>Direkter DB-Zugriff zum Arrangieren von Testdaten.</summary>
    public MongoContext Db => Services.GetRequiredService<MongoContext>();

    protected override void Dispose(bool disposing)
    {
        base.Dispose(disposing);
        if (disposing)
        {
            _mongo.Dispose();
            Environment.SetEnvironmentVariable("Mongo__ConnectionString", null);
            Environment.SetEnvironmentVariable("Mongo__Database", null);
            Environment.SetEnvironmentVariable("Clerk__Authority", null);
            Environment.SetEnvironmentVariable("Clerk__WebhookSecret", null);
        }
    }
}

[CollectionDefinition(Name)]
public class IntegrationCollection : ICollectionFixture<DevEduApiFactory>
{
    public const string Name = "integration";
}

// ─── Test-Authentifizierung ─────────────────────────────────────────────────

/// <summary>
/// Baut aus den Headern X-Test-Sub (Clerk user id) und X-Test-Role
/// (instructor/admin/leer=learner) ein ClaimsPrincipal mit rohem "role"-Claim —
/// die ClerkRoleClaimsTransformation mappt ihn dann auf ClaimTypes.Role.
/// Fehlt X-Test-Sub, bleibt der Request anonym (→ 401 auf geschützten Endpunkten).
/// </summary>
public class TestAuthHandler : AuthenticationHandler<AuthenticationSchemeOptions>
{
    public const string SchemeName = "Test";

    public TestAuthHandler(
        IOptionsMonitor<AuthenticationSchemeOptions> options,
        ILoggerFactory logger,
        UrlEncoder encoder)
        : base(options, logger, encoder) { }

    protected override Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        var sub = Request.Headers["X-Test-Sub"].FirstOrDefault();
        if (string.IsNullOrEmpty(sub))
            return Task.FromResult(AuthenticateResult.NoResult());

        var claims = new List<Claim> { new("sub", sub) };
        var role = Request.Headers["X-Test-Role"].FirstOrDefault();
        if (!string.IsNullOrEmpty(role))
            claims.Add(new Claim("role", role));

        var identity = new ClaimsIdentity(claims, SchemeName, "sub", ClaimTypes.Role);
        var ticket = new AuthenticationTicket(new ClaimsPrincipal(identity), SchemeName);
        return Task.FromResult(AuthenticateResult.Success(ticket));
    }
}

// ─── Fake-Sandbox ───────────────────────────────────────────────────────────

/// <summary>
/// Deterministischer Ersatz für den Podman-Runner. Standard: alles besteht.
/// Marker im Code steuern die Pfade: "// COMPILE_ERROR" → Compile-Fehler,
/// "// FAIL" → kompiliert, aber alle Testfälle schlagen fehl.
/// </summary>
public class FakeSandboxRunner : ISandboxRunner
{
    public Task<SandboxRunResult> RunAsync(
        string code, CodeLanguage language, IReadOnlyList<CodeTestCase> testCases,
        SandboxLimits limits, CancellationToken ct)
    {
        if (code.Contains("// COMPILE_ERROR"))
            return Task.FromResult(new SandboxRunResult(false, "Simulierter Compile-Fehler",
                Array.Empty<SandboxTestResult>(), 1));

        bool fail = code.Contains("// FAIL");
        var tests = testCases.Select(tc => new SandboxTestResult(
            tc.Id,
            Passed: !fail,
            Outcome: fail ? CodeRunOutcome.Failed : CodeRunOutcome.Passed,
            DurationMs: 1,
            ActualOutput: fail ? "wrong" : tc.ExpectedOutput,
            Stderr: "")).ToList();

        return Task.FromResult(new SandboxRunResult(true, null, tests, 2));
    }
}

// ─── HTTP-Helfer ────────────────────────────────────────────────────────────

public static class ApiClientExtensions
{
    /// <summary>Authentifizierte Anfrage mit Test-Identität (sub + optionale Clerk-Rolle).</summary>
    public static Task<HttpResponseMessage> SendAsAsync(
        this HttpClient client, HttpMethod method, string url,
        string sub, string? role = null, object? body = null)
    {
        var req = new HttpRequestMessage(method, url);
        req.Headers.Add("X-Test-Sub", sub);
        if (role is not null) req.Headers.Add("X-Test-Role", role);
        if (body is not null) req.Content = JsonContent.Create(body);
        return client.SendAsync(req);
    }

    public static Task<HttpResponseMessage> GetAsAsync(this HttpClient c, string url, string sub, string? role = null)
        => c.SendAsAsync(HttpMethod.Get, url, sub, role);

    public static Task<HttpResponseMessage> PostAsAsync(this HttpClient c, string url, string sub, string? role = null, object? body = null)
        => c.SendAsAsync(HttpMethod.Post, url, sub, role, body);

    public static Task<HttpResponseMessage> PutAsAsync(this HttpClient c, string url, string sub, string? role = null, object? body = null)
        => c.SendAsAsync(HttpMethod.Put, url, sub, role, body);

    public static Task<HttpResponseMessage> DeleteAsAsync(this HttpClient c, string url, string sub, string? role = null)
        => c.SendAsAsync(HttpMethod.Delete, url, sub, role);
}
