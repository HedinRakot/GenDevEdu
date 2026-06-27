namespace DevEdu.Api.Dtos;

public record UserDto(string Id, string Email, string DisplayName, List<string> Roles);

// ─── Clerk Webhook ────────────────────────────────────────────────────────────

public record ClerkWebhookPayload(string Type, ClerkWebhookUserData Data);

public record ClerkWebhookUserData(
    string Id,
    string? First_name,
    string? Last_name,
    List<ClerkEmailAddress>? Email_addresses,
    ClerkPublicMetadata? Public_metadata);

public record ClerkEmailAddress(string Email_address, bool Primary);

public record ClerkPublicMetadata(string? Role);
