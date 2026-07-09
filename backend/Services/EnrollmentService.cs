using DevEdu.Api.Dtos;
using DevEdu.Api.Models;
using MongoDB.Driver;

namespace DevEdu.Api.Services;

public class EnrollmentService
{
    private readonly MongoContext _db;
    private readonly CertificateService _certs;

    public EnrollmentService(MongoContext db, CertificateService certs)
    {
        _db = db;
        _certs = certs;
    }

    public async Task<ServiceResult<EnrollmentDto>> EnrollAsync(CreateEnrollmentRequest req, string userId)
    {
        if (string.IsNullOrWhiteSpace(req.CourseId))
            return ServiceResult<EnrollmentDto>.Validation("courseId is required.");

        var course = await _db.Courses.Find(c => c.Id == req.CourseId).FirstOrDefaultAsync();
        if (course is null)
            return ServiceResult<EnrollmentDto>.NotFound("Course not found.");
        if (course.Status != CourseStatus.Published)
            return ServiceResult<EnrollmentDto>.Validation("Course is not published.");

        var existing = await _db.Enrollments
            .Find(e => e.UserId == userId && e.CourseId == req.CourseId)
            .FirstOrDefaultAsync();
        if (existing is not null)
            return ServiceResult<EnrollmentDto>.Ok(
                new EnrollmentDto(existing.Id, existing.CourseId, existing.Status, existing.StartedAt));

        var enrollment = new Enrollment { UserId = userId, CourseId = req.CourseId };
        await _db.Enrollments.InsertOneAsync(enrollment);

        var progress = await _db.Progress
            .Find(p => p.UserId == userId && p.CourseId == req.CourseId)
            .FirstOrDefaultAsync();
        if (progress is null)
            await _db.Progress.InsertOneAsync(new Progress { UserId = userId, CourseId = req.CourseId });

        return ServiceResult<EnrollmentDto>.Ok(
            new EnrollmentDto(enrollment.Id, enrollment.CourseId, enrollment.Status, enrollment.StartedAt));
    }

    public async Task<List<ProgressDto>> GetProgressAsync(string userId)
    {
        var items = await _db.Progress.Find(p => p.UserId == userId).ToListAsync();
        return items
            .Select(p => new ProgressDto(p.CourseId, p.CompletedChapterContentIds))
            .ToList();
    }

    public async Task<ServiceResult<ProgressDto>> CompleteChapterContentAsync(
        string chapterContentId, string userId)
    {
        var course = await _db.Courses
            .Find(c => c.Chapters.Any(ch => ch.ChapterContent.Any(cc => cc.Id == chapterContentId)))
            .FirstOrDefaultAsync();
        if (course is null)
            return ServiceResult<ProgressDto>.NotFound("ChapterContent not found.");

        var progress = await _db.Progress
            .Find(p => p.UserId == userId && p.CourseId == course.Id)
            .FirstOrDefaultAsync();

        if (progress is null)
        {
            progress = new Progress { UserId = userId, CourseId = course.Id };
            await _db.Progress.InsertOneAsync(progress);
        }

        if (!progress.CompletedChapterContentIds.Contains(chapterContentId))
            progress.CompletedChapterContentIds.Add(chapterContentId);

        // Zeitstempel je Abschluss mitschreiben (Teilnehmer-Dashboard: echter
        // Bearbeitungszeitpunkt statt nur "irgendwann abgehakt"). Idempotent.
        if (!progress.ContentCompletions.Any(cc => cc.ContentId == chapterContentId))
            progress.ContentCompletions.Add(new ContentCompletion { ContentId = chapterContentId });

        progress.LastVisited = DateTime.UtcNow;
        await _db.Progress.ReplaceOneAsync(p => p.Id == progress.Id, progress);

        // F10: prüfen, ob der Kurs damit abgeschlossen ist → ggf. Zertifikat ausstellen.
        await _certs.CheckAndIssueAsync(userId, course.Id);

        return ServiceResult<ProgressDto>.Ok(
            new ProgressDto(progress.CourseId, progress.CompletedChapterContentIds));
    }
}
