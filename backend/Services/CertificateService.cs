using DevEdu.Api.Dtos;
using DevEdu.Api.Models;
using MongoDB.Driver;

namespace DevEdu.Api.Services;

public class CertificateService
{
    private readonly MongoContext _db;
    private readonly ILogger<CertificateService> _logger;

    public CertificateService(MongoContext db, ILogger<CertificateService> logger)
    {
        _db = db;
        _logger = logger;
    }

    /// <summary>
    /// Prüft bei einem Abschluss-Event, ob der Kurs vollständig ist, und stellt – falls ja –
    /// einmalig ein Zertifikat aus + setzt Enrollment.CompletedAt. Best effort (wirft nicht).
    /// </summary>
    public async Task CheckAndIssueAsync(string userId, string courseId)
    {
        try
        {
            var course = await _db.Courses.Find(c => c.Id == courseId).FirstOrDefaultAsync();
            if (course is null) return;

            var progress = await _db.Progress
                .Find(p => p.UserId == userId && p.CourseId == courseId)
                .FirstOrDefaultAsync();

            if (!CourseCompletion.IsCourseComplete(course, progress)) return;

            // Enrollment als abgeschlossen markieren (falls vorhanden & noch offen).
            await _db.Enrollments.UpdateOneAsync(
                e => e.UserId == userId && e.CourseId == courseId && e.CompletedAt == null,
                Builders<Enrollment>.Update.Set(e => e.CompletedAt, DateTime.UtcNow));

            // Idempotent: existiert bereits ein Zertifikat?
            var exists = await _db.Certificates
                .Find(c => c.UserId == userId && c.CourseId == courseId)
                .AnyAsync();
            if (exists) return;

            var user = await _db.Users.Find(u => u.ClerkUserId == userId).FirstOrDefaultAsync();
            var learnerName = user?.DisplayName is { Length: > 0 } dn ? dn
                : user?.Email is { Length: > 0 } em ? em
                : "Lerner";

            var cert = new Certificate
            {
                UserId = userId,
                CourseId = courseId,
                CourseName = Mappers.PrimaryText(course.Titel),
                LearnerName = learnerName,
                VerificationCode = Guid.NewGuid().ToString("N")[..12].ToUpperInvariant(),
            };

            try
            {
                await _db.Certificates.InsertOneAsync(cert);
            }
            catch (MongoWriteException ex) when (ex.WriteError?.Category == ServerErrorCategory.DuplicateKey)
            {
                // Race: ein paralleler Abschluss-Event hat das Zertifikat bereits angelegt.
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Certificate issuance failed for user {User}, course {Course}.", userId, courseId);
        }
    }

    public async Task<List<CertificateDto>> GetMineAsync(string userId)
    {
        var certs = await _db.Certificates
            .Find(c => c.UserId == userId)
            .SortByDescending(c => c.IssuedAt)
            .ToListAsync();

        return certs
            .Select(c => new CertificateDto(c.Id, c.CourseId, c.CourseName, c.LearnerName, c.VerificationCode, c.IssuedAt))
            .ToList();
    }
}
