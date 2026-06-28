namespace DevEdu.Api.Dtos;

// ─── Zertifikate (F10, GET /api/me/certificates) ─────────────────────────────

public record CertificateDto(
    string Id,
    string CourseId,
    string CourseName,
    string LearnerName,
    string VerificationCode,
    DateTime IssuedAt);
