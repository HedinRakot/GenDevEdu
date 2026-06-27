namespace DevEdu.Api.Dtos;

// ─── Admin: Rollenverwaltung (Clerk) ─────────────────────────────────────────

/// <summary>Ein Nutzer aus der Clerk Backend API für die Admin-Übersicht.</summary>
public record AdminUserDto(string Id, string Email, string Role);

/// <summary>Body von PATCH /api/admin/users/{id}/role.</summary>
public record SetRoleRequest(string Role);
