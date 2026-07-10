using DevEdu.Api.Dtos;
using DevEdu.Api.Models;
using MongoDB.Driver;

namespace DevEdu.Api.Services;

public class EnrollmentService
{
    private readonly MongoContext _db;

    public EnrollmentService(MongoContext db) => _db = db;

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

        var enrollment = new Enrollment { UserId = userId, CourseId = req.CourseId, Status = "Active" };
        await _db.Enrollments.InsertOneAsync(enrollment);

        // Ensure a progress doc exists.
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
        return items.Select(p => new ProgressDto(
            p.CourseId,
            p.CompletedTopicIds,
            p.CompletedChapterIds,
            p.ChapterQuizResults.Select(r => new ChapterQuizSummaryDto(
                r.ChapterId, r.EarnedPoints, r.TotalPoints, r.PassingThresholdPct, r.Passed)).ToList()
        )).ToList();
    }

    public async Task<ServiceResult<ProgressDto>> CompleteTopicAsync(string topicId, string userId)
    {
        var course = await _db.Courses
            .Find(c => c.Chapters.Any(ch => ch.Topics.Any(t => t.Id == topicId)))
            .FirstOrDefaultAsync();
        if (course is null)
            return ServiceResult<ProgressDto>.NotFound("Topic not found.");

        var progress = await _db.Progress
            .Find(p => p.UserId == userId && p.CourseId == course.Id)
            .FirstOrDefaultAsync();

        if (progress is null)
        {
            progress = new Progress { UserId = userId, CourseId = course.Id };
            await _db.Progress.InsertOneAsync(progress);
        }

        if (!progress.CompletedTopicIds.Contains(topicId))
            progress.CompletedTopicIds.Add(topicId);

        // Mark chapter complete if all its topics are done.
        foreach (var chapter in course.Chapters)
        {
            var topicIds = chapter.Topics.Select(t => t.Id).ToList();
            if (topicIds.Count > 0 && topicIds.All(id => progress.CompletedTopicIds.Contains(id)))
            {
                if (!progress.CompletedChapterIds.Contains(chapter.Id))
                    progress.CompletedChapterIds.Add(chapter.Id);
            }
        }

        progress.LastVisited = DateTime.UtcNow;
        await _db.Progress.ReplaceOneAsync(p => p.Id == progress.Id, progress);

        return ServiceResult<ProgressDto>.Ok(
            new ProgressDto(progress.CourseId, progress.CompletedTopicIds, progress.CompletedChapterIds,
                progress.ChapterQuizResults.Select(r =>
                    new ChapterQuizSummaryDto(r.ChapterId, r.EarnedPoints, r.TotalPoints, r.PassingThresholdPct, r.Passed)).ToList()));
    }
}
