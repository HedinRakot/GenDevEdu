using System.Net;
using System.Net.Http.Headers;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using DevEdu.Api.Models;
using MongoDB.Driver;
using Xunit;

namespace DevEdu.Api.Tests.Integration;

[Collection(IntegrationCollection.Name)]
public class AuthWebhookTests
{
    private readonly DevEduApiFactory _factory;
    private readonly HttpClient _client;

    public AuthWebhookTests(DevEduApiFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    private static string UserCreatedBody(string clerkId, string email, string role) =>
        JsonSerializer.Serialize(new
        {
            type = "user.created",
            data = new
            {
                id = clerkId,
                first_name = "Test",
                last_name = "User",
                email_addresses = new[] { new { email_address = email, primary = true } },
                public_metadata = new { role },
            },
        });

    /// <summary>Baut eine signierte Webhook-Anfrage (gültiges Svix-Schema).</summary>
    private HttpRequestMessage SignedRequest(string body, long? timestamp = null, byte[]? key = null)
    {
        var svixId = $"msg_{Guid.NewGuid():N}";
        var ts = (timestamp ?? DateTimeOffset.UtcNow.ToUnixTimeSeconds()).ToString();
        var signedContent = $"{svixId}.{ts}.{body}";

        using var hmac = new HMACSHA256(key ?? DevEduApiFactory.WebhookKey);
        var sig = Convert.ToBase64String(hmac.ComputeHash(Encoding.UTF8.GetBytes(signedContent)));

        var req = new HttpRequestMessage(HttpMethod.Post, "/api/webhooks/clerk")
        {
            Content = new StringContent(body, Encoding.UTF8, "application/json"),
        };
        req.Headers.Add("svix-id", svixId);
        req.Headers.Add("svix-timestamp", ts);
        req.Headers.Add("svix-signature", $"v1,{sig}");
        return req;
    }

    [Fact]
    public async Task ValidSignature_CreatesUserWithMappedRole()
    {
        var clerkId = $"user_{Guid.NewGuid():N}";
        var body = UserCreatedBody(clerkId, "instructor@devedu.test", "instructor");

        var res = await _client.SendAsync(SignedRequest(body));
        Assert.Equal(HttpStatusCode.OK, res.StatusCode);

        var user = await _factory.Db.Users.Find(u => u.ClerkUserId == clerkId).FirstOrDefaultAsync();
        Assert.NotNull(user);
        Assert.Contains(Roles.Author, user!.Roles);   // instructor → Author
        Assert.Equal("instructor@devedu.test", user.Email);
    }

    [Fact]
    public async Task InvalidSignature_Returns401_AndDoesNotPersist()
    {
        var clerkId = $"user_{Guid.NewGuid():N}";
        var body = UserCreatedBody(clerkId, "x@devedu.test", "admin");

        // Mit falschem Schlüssel signiert.
        var bogusKey = Encoding.UTF8.GetBytes("wrong-key-wrong-key-wrong-key-32");
        var res = await _client.SendAsync(SignedRequest(body, key: bogusKey));

        Assert.Equal(HttpStatusCode.Unauthorized, res.StatusCode);
        Assert.Equal(0, await _factory.Db.Users.CountDocumentsAsync(u => u.ClerkUserId == clerkId));
    }

    [Fact]
    public async Task ReplayedTimestamp_OutsideWindow_Returns401()
    {
        var clerkId = $"user_{Guid.NewGuid():N}";
        var body = UserCreatedBody(clerkId, "old@devedu.test", "learner");

        // 10 Minuten alt → außerhalb des 5-Minuten-Replay-Fensters.
        var oldTs = DateTimeOffset.UtcNow.ToUnixTimeSeconds() - 600;
        var res = await _client.SendAsync(SignedRequest(body, timestamp: oldTs));

        Assert.Equal(HttpStatusCode.Unauthorized, res.StatusCode);
    }
}
