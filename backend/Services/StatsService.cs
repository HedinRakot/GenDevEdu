using DevEdu.Api.Dtos;
using MongoDB.Driver;

namespace DevEdu.Api.Services;

public class StatsService
{
    private readonly MongoContext _db;

    public StatsService(MongoContext db) => _db = db;

    public async Task<LearnerStatsDto> GetStatsAsync(string userId)
    {
        var enrollments = await _db.Enrollments.Find(e => e.UserId == userId).ToListAsync();
        var progress = await _db.Progress.Find(p => p.UserId == userId).ToListAsync();
        var attempts = await _db.Attempts.Find(a => a.UserId == userId).ToListAsync();
        var quizAttempts = await _db.ChapterQuizAttempts.Find(a => a.UserId == userId).ToListAsync();
        var codeSubs = await _db.CodeSubmissions.Find(s => s.UserId == userId).ToListAsync();

        // Eingeschriebene Kurse (über Enrollment ODER vorhandenen Fortschritt).
        var courseIds = enrollments.Select(e => e.CourseId)
            .Concat(progress.Select(p => p.CourseId))
            .Distinct()
            .ToList();
        var courses = courseIds.Count == 0
            ? new()
            : await _db.Courses.Find(c => courseIds.Contains(c.Id)).ToListAsync();

        return StatsCalculator.Build(courses, enrollments, progress, attempts, quizAttempts, codeSubs);
    }
}
