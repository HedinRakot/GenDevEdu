using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using DevEdu.Api.Dtos;
using DevEdu.Api.Models;
using DevEdu.Api.Services;
using MongoDB.Driver;

namespace DevEdu.Api.Endpoints;

public static class AuthEndpoints
{
    public static void MapAuthEndpoints(this IEndpointRouteBuilder app)
    {
        // ── Aktueller Nutzer ──────────────────────────────────────────────────
        app.MapGet("/api/users/me", (ClaimsPrincipal principal, MongoContext db) =>
        {
            var clerkId = principal.FindFirstValue(ClaimTypes.NameIdentifier)
                          ?? principal.FindFirstValue("sub")
                          ?? string.Empty;
            return db.Users.Find(u => u.ClerkUserId == clerkId).FirstOrDefaultAsync()
                .ContinueWith(t =>
                    t.Result is { } u
                        ? Results.Ok(new UserDto(u.Id, u.Email, u.DisplayName, u.Roles))
                        : Results.NotFound());
        }).RequireAuthorization();

        // ── Clerk Webhook: user.created / user.updated / user.deleted ─────────
        // Clerk (über Svix) sendet ein HMAC-SHA256-signiertes POST auf diesen
        // Endpunkt und hält damit die Mongo-`users`-Collection (inkl. Rolle) in
        // Sync. Der Endpunkt ist bewusst anonym — die Echtheit wird ausschließlich
        // über die Svix-Signatur geprüft.
        //
        // Lokales Setup (siehe README → "Clerk Webhook (lokal)"):
        //   1. Backend per `kubectl port-forward svc/backend 8080:8080` erreichbar machen.
        //   2. Tunnel starten, z. B. `ngrok http 8080`.
        //   3. Clerk Dashboard → Webhooks → Endpoint `<tunnel>/api/webhooks/clerk`,
        //      Events user.created/updated/deleted abonnieren.
        //   4. Signing Secret (whsec_…) als Clerk__WebhookSecret ins k8s-Secret
        //      `backend-secrets` legen und Backend neu ausrollen.
        app.MapPost("/api/webhooks/clerk", async (HttpRequest req, MongoContext db,
            IConfiguration config, ILogger<Program> logger) =>
        {
            // Rohen Body genau einmal lesen — für die HMAC-Prüfung wird der
            // unveränderte Byte-/Zeichenstrom benötigt (kein Re-Serialize).
            string body;
            using (var reader = new StreamReader(req.Body, Encoding.UTF8))
                body = await reader.ReadToEndAsync();

            var secret = config["Clerk:WebhookSecret"] ?? string.Empty;
            if (!VerifyClerkSignature(req.Headers, body, secret, logger))
            {
                logger.LogWarning("Clerk webhook: invalid signature");
                return Results.Unauthorized();
            }

            ClerkWebhookPayload? payload;
            try
            {
                payload = JsonSerializer.Deserialize<ClerkWebhookPayload>(
                    body, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
            }
            catch (JsonException ex)
            {
                logger.LogWarning(ex, "Clerk webhook: malformed payload");
                return Results.BadRequest();
            }

            if (payload is null) return Results.BadRequest();

            switch (payload.Type)
            {
                case "user.created" or "user.updated":
                    await UpsertUser(db, payload.Data, logger);
                    break;
                case "user.deleted":
                    await DeleteUser(db, payload.Data, logger);
                    break;
                default:
                    logger.LogInformation("Clerk webhook: ignoring event {Type}", payload.Type);
                    break;
            }

            return Results.Ok();
        }).AllowAnonymous();
    }

    private static async Task UpsertUser(MongoContext db, ClerkWebhookUserData data,
        ILogger logger)
    {
        var email = data.Email_addresses
                        ?.FirstOrDefault(e => e.Primary)?.Email_address
                    ?? data.Email_addresses?.FirstOrDefault()?.Email_address
                    ?? string.Empty;

        var displayName = string.Join(" ",
            new[] { data.First_name, data.Last_name }.Where(s => !string.IsNullOrWhiteSpace(s)));
        if (string.IsNullOrWhiteSpace(displayName)) displayName = email;

        var rawRole = data.Public_metadata?.Role ?? string.Empty;
        var role = rawRole switch
        {
            "instructor" => Roles.Author,
            "admin" => Roles.Admin,
            _ => Roles.Learner,
        };

        var existing = await db.Users.Find(u => u.ClerkUserId == data.Id).FirstOrDefaultAsync();
        if (existing is null)
        {
            var user = new User
            {
                ClerkUserId = data.Id,
                Email = email,
                DisplayName = displayName,
                Roles = new List<string> { role },
            };
            await db.Users.InsertOneAsync(user);
            logger.LogInformation("Clerk webhook: created user {ClerkId}", data.Id);
        }
        else
        {
            var update = MongoDB.Driver.Builders<User>.Update
                .Set(u => u.Email, email)
                .Set(u => u.DisplayName, displayName)
                .Set(u => u.Roles, new List<string> { role });
            await db.Users.UpdateOneAsync(u => u.ClerkUserId == data.Id, update);
            logger.LogInformation("Clerk webhook: updated user {ClerkId}", data.Id);
        }
    }

    private static async Task DeleteUser(MongoContext db, ClerkWebhookUserData data, ILogger logger)
    {
        if (string.IsNullOrWhiteSpace(data.Id)) return;

        var result = await db.Users.DeleteOneAsync(u => u.ClerkUserId == data.Id);
        if (result.DeletedCount > 0)
            logger.LogInformation("Clerk webhook: deleted user {ClerkId}", data.Id);
    }

    /// <summary>
    /// Verifiziert die Svix-Signatur eines Clerk-Webhooks gegen den rohen Body.
    /// Schema: HMAC-SHA256 über "{svix-id}.{svix-timestamp}.{body}" mit dem
    /// base64-dekodierten Secret (ohne "whsec_"-Präfix); der svix-signature-Header
    /// enthält ein oder mehrere leerzeichengetrennte "v1,&lt;base64&gt;"-Einträge.
    /// Ohne konfiguriertes Secret wird die Prüfung übersprungen (nur Dev).
    /// </summary>
    private static bool VerifyClerkSignature(IHeaderDictionary headers, string body, string secret,
        ILogger logger)
    {
        if (string.IsNullOrWhiteSpace(secret))
        {
            logger.LogWarning("Clerk webhook: no Clerk:WebhookSecret configured — " +
                              "skipping signature verification (DEV ONLY, do not use in production).");
            return true;
        }

        var svixId = headers["svix-id"].FirstOrDefault();
        var svixTimestamp = headers["svix-timestamp"].FirstOrDefault();
        var svixSignature = headers["svix-signature"].FirstOrDefault();

        if (string.IsNullOrWhiteSpace(svixId) ||
            string.IsNullOrWhiteSpace(svixTimestamp) ||
            string.IsNullOrWhiteSpace(svixSignature))
            return false;

        // Replay-Schutz: Zeitstempel außerhalb eines 5-Minuten-Fensters ablehnen.
        if (!long.TryParse(svixTimestamp, out var ts) ||
            Math.Abs(DateTimeOffset.UtcNow.ToUnixTimeSeconds() - ts) > 300)
            return false;

        byte[] key;
        try { key = Convert.FromBase64String(secret.Replace("whsec_", string.Empty)); }
        catch (FormatException) { return false; }

        var signedContent = $"{svixId}.{svixTimestamp}.{body}";
        using var hmac = new HMACSHA256(key);
        var expected = hmac.ComputeHash(Encoding.UTF8.GetBytes(signedContent));

        // Header trägt eine oder mehrere leerzeichengetrennte "v1,<base64>"-Signaturen.
        foreach (var part in svixSignature.Split(' ', StringSplitOptions.RemoveEmptyEntries))
        {
            var comma = part.IndexOf(',');
            if (comma < 0) continue;

            byte[] provided;
            try { provided = Convert.FromBase64String(part[(comma + 1)..]); }
            catch (FormatException) { continue; }

            if (CryptographicOperations.FixedTimeEquals(provided, expected))
                return true;
        }

        return false;
    }
}
