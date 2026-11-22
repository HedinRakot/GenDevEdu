namespace DevEdu.Api.Dtos;

// ─── Zertifikate (F10, GET /api/me/certificates) ─────────────────────────────

public record CertificateDto(
    string Id,
    string CourseId,
    string CourseName,
    string LearnerName,
    string VerificationCode,
    DateTime IssuedAt);

// ─── Öffentliche Verifikation (GET /api/certificates/{code}, ohne Auth) ──────
// Bewusst schlank: nur was zur Bestätigung nötig ist, keine internen Ids/UserId.
public record CertificateVerificationDto(
    bool Valid,
    string? CourseName,
    string? LearnerName,
    DateTime? IssuedAt);
