using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using DevEdu.Api.Dtos;

namespace DevEdu.Api.Services;

/// <summary>
/// Dünner Wrapper um die Clerk Backend API (https://api.clerk.com/v1) für die
/// Admin-Rollenverwaltung. Authentifiziert via Bearer-Secret-Key (Clerk:SecretKey),
/// der im typed HttpClient (siehe Program.cs) gesetzt wird.
/// Rollen-Werte: "learner" | "instructor" (= Author) | "admin".
/// </summary>
public class ClerkAdminService
{
    private readonly HttpClient _http;
    private readonly ILogger<ClerkAdminService> _logger;

    private static readonly JsonSerializerOptions Json = new() { PropertyNameCaseInsensitive = true };
    private static readonly HashSet<string> AllowedRoles = new() { "learner", "instructor", "admin" };

    public ClerkAdminService(HttpClient http, ILogger<ClerkAdminService> logger)
    {
        _http = http;
        _logger = logger;
    }

    private bool Configured =>
        !string.IsNullOrWhiteSpace(_http.DefaultRequestHeaders.Authorization?.Parameter);

    public async Task<ServiceResult<List<AdminUserDto>>> ListUsersAsync(int limit = 100)
    {
        if (!Configured)
            return ServiceResult<List<AdminUserDto>>.Validation("Clerk secret key not configured (Clerk:SecretKey).");

        HttpResponseMessage resp;
        try
        {
            resp = await _http.GetAsync($"users?limit={limit}&order_by=-created_at");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Clerk list users request failed");
            return ServiceResult<List<AdminUserDto>>.Validation("Could not reach Clerk API.");
        }

        if (!resp.IsSuccessStatusCode)
        {
            _logger.LogWarning("Clerk list users failed: {Status}", resp.StatusCode);
            return ServiceResult<List<AdminUserDto>>.Validation($"Clerk API error ({(int)resp.StatusCode}).");
        }

        var users = await resp.Content.ReadFromJsonAsync<List<ClerkUser>>(Json) ?? new();
        return ServiceResult<List<AdminUserDto>>.Ok(users.Select(ToDto).ToList());
    }

    public async Task<ServiceResult<AdminUserDto>> SetRoleAsync(string userId, string? role)
    {
        if (!Configured)
            return ServiceResult<AdminUserDto>.Validation("Clerk secret key not configured (Clerk:SecretKey).");

        var normalized = (role ?? string.Empty).Trim().ToLowerInvariant();
        if (!AllowedRoles.Contains(normalized))
            return ServiceResult<AdminUserDto>.Validation("Invalid role. Allowed: learner, instructor, admin.");

        // Merge-PATCH der public_metadata; überschreibt nur "role".
        var body = new { public_metadata = new { role = normalized } };

        HttpResponseMessage resp;
        try
        {
            resp = await _http.PatchAsJsonAsync($"users/{userId}/metadata", body);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Clerk set role request failed");
            return ServiceResult<AdminUserDto>.Validation("Could not reach Clerk API.");
        }

        if (resp.StatusCode == HttpStatusCode.NotFound)
            return ServiceResult<AdminUserDto>.NotFound("User not found.");
        if (!resp.IsSuccessStatusCode)
        {
            _logger.LogWarning("Clerk set role failed: {Status}", resp.StatusCode);
            return ServiceResult<AdminUserDto>.Validation($"Clerk API error ({(int)resp.StatusCode}).");
        }

        var updated = await resp.Content.ReadFromJsonAsync<ClerkUser>(Json);
        return ServiceResult<AdminUserDto>.Ok(
            updated is null ? new AdminUserDto(userId, string.Empty, normalized) : ToDto(updated));
    }

    private static AdminUserDto ToDto(ClerkUser u)
    {
        var email = u.EmailAddresses?.FirstOrDefault(e => e.Id == u.PrimaryEmailAddressId)?.EmailAddress
                    ?? u.EmailAddresses?.FirstOrDefault()?.EmailAddress
                    ?? string.Empty;
        var role = u.PublicMetadata?.Role;
        if (string.IsNullOrWhiteSpace(role)) role = "learner";
        return new AdminUserDto(u.Id, email, role);
    }

    // ─── Clerk API Response-Formen ───────────────────────────────────────────
    private record ClerkUser(
        [property: JsonPropertyName("id")] string Id,
        [property: JsonPropertyName("email_addresses")] List<ClerkEmail>? EmailAddresses,
        [property: JsonPropertyName("primary_email_address_id")] string? PrimaryEmailAddressId,
        [property: JsonPropertyName("public_metadata")] ClerkPublicMetadata? PublicMetadata);

    private record ClerkEmail(
        [property: JsonPropertyName("id")] string Id,
        [property: JsonPropertyName("email_address")] string EmailAddress);

    private record ClerkPublicMetadata(
        [property: JsonPropertyName("role")] string? Role);
}
