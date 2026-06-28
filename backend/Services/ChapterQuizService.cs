using DevEdu.Api.Dtos;
using DevEdu.Api.Models;
using MongoDB.Driver;

namespace DevEdu.Api.Services;

public class ChapterQuizService
{
    private readonly MongoContext _db;
    private readonly CertificateService _certs;

    public ChapterQuizService(MongoContext db, CertificateService certs)
    {
        _db = db;
        _certs = certs;
    }

    // ─── Autor: Quiz setzen / ersetzen ──────────────────────────────────────────

    public async Task<ServiceResult<ChapterQuizDto>> SetAsync(
        string chapterId, SetChapterQuizRequest req, string userId, bool isAdmin)
    {
        var course = await FindCourseByChapterAsync(chapterId);
        if (course is null)
            return ServiceResult<ChapterQuizDto>.NotFound("Chapter not found.");
        if (!isAdmin && course.AuthorId != userId)
            return ServiceResult<ChapterQuizDto>.Forbidden("Not your course.");

        var chapter = course.Chapters.First(ch => ch.Id == chapterId);

        var reqs = req.Questions ?? new();
        if (reqs.Count == 0)
            return ServiceResult<ChapterQuizDto>.Validation("At least one question is required.");
        if (reqs.Any(q => !Grading.IsAutoGradable((MobileQuestionType)q.QuestionType)))
            return ServiceResult<ChapterQuizDto>.Validation(
                "Chapter quizzes support only auto-gradable question types (SingleChoice, MultipleChoice, TrueFalse).");

        // Ersetzen: alte QuestionList + Versuche + bestandene-Markierungen verwerfen.
        if (!string.IsNullOrEmpty(chapter.ChapterQuizId))
            await ClearQuizDataAsync(chapter.ChapterQuizId, chapterId);

        var qlId = Guid.NewGuid().ToString("N");
        var ql = new QuestionList
        {
            Id = qlId,
            ElementId = qlId,
            CourseId = course.Id,
            ChapterId = chapterId,
            ChapterContentId = string.Empty,
            Questions = reqs.Select(Mappers.ToQuestion).ToList(),
        };
        await _db.QuestionLists.InsertOneAsync(ql);

        chapter.ChapterQuizId = qlId;
        chapter.PassThresholdPercent = Math.Clamp(req.PassThresholdPercent ?? 60, 0, 100);
        chapter.MaxAttempts = Math.Max(0, req.MaxAttempts ?? 0);
        course.UpdatedAt = DateTime.UtcNow;
        await _db.Courses.ReplaceOneAsync(c => c.Id == course.Id, course);

        return ServiceResult<ChapterQuizDto>.Ok(
            Mappers.ToChapterQuizDto(ql, chapter, reveal: true, attemptsUsed: 0, bestPercent: null, passed: false));
    }

    public async Task<ServiceResult<bool>> DeleteAsync(string chapterId, string userId, bool isAdmin)
    {
        var course = await FindCourseByChapterAsync(chapterId);
        if (course is null)
            return ServiceResult<bool>.NotFound("Chapter not found.");
        if (!isAdmin && course.AuthorId != userId)
            return ServiceResult<bool>.Forbidden("Not your course.");

        var chapter = course.Chapters.First(ch => ch.Id == chapterId);
        if (string.IsNullOrEmpty(chapter.ChapterQuizId))
            return ServiceResult<bool>.Ok(true);

        await ClearQuizDataAsync(chapter.ChapterQuizId, chapterId);
        chapter.ChapterQuizId = null;
        course.UpdatedAt = DateTime.UtcNow;
        await _db.Courses.ReplaceOneAsync(c => c.Id == course.Id, course);

        return ServiceResult<bool>.Ok(true);
    }

    // ─── Lerner/Autor: Quiz abrufen ─────────────────────────────────────────────

    public async Task<ServiceResult<ChapterQuizDto>> GetAsync(
        string chapterId, string userId, IReadOnlySet<string> roles)
    {
        var course = await FindCourseByChapterAsync(chapterId);
        if (course is null)
            return ServiceResult<ChapterQuizDto>.NotFound("Chapter not found.");

        var chapter = course.Chapters.First(ch => ch.Id == chapterId);
        if (string.IsNullOrEmpty(chapter.ChapterQuizId))
            return ServiceResult<ChapterQuizDto>.NotFound("Chapter has no quiz.");

        var ql = await _db.QuestionLists.Find(x => x.Id == chapter.ChapterQuizId).FirstOrDefaultAsync();
        if (ql is null)
            return ServiceResult<ChapterQuizDto>.NotFound("Quiz not found.");

        bool reveal = roles.Contains(Roles.Admin) ||
                      (roles.Contains(Roles.Author) && course.AuthorId == userId);

        var (used, best, passed) = await AttemptStatusAsync(userId, chapterId);
        return ServiceResult<ChapterQuizDto>.Ok(
            Mappers.ToChapterQuizDto(ql, chapter, reveal, used, best, passed));
    }

    // ─── Lerner: Quiz abgeben ───────────────────────────────────────────────────

    public async Task<ServiceResult<ChapterQuizResultDto>> SubmitAsync(
        string chapterId, SubmitChapterQuizRequest req, string userId)
    {
        var course = await FindCourseByChapterAsync(chapterId);
        if (course is null)
            return ServiceResult<ChapterQuizResultDto>.NotFound("Chapter not found.");

        var chapter = course.Chapters.First(ch => ch.Id == chapterId);
        if (string.IsNullOrEmpty(chapter.ChapterQuizId))
            return ServiceResult<ChapterQuizResultDto>.NotFound("Chapter has no quiz.");

        var ql = await _db.QuestionLists.Find(x => x.Id == chapter.ChapterQuizId).FirstOrDefaultAsync();
        if (ql is null)
            return ServiceResult<ChapterQuizResultDto>.NotFound("Quiz not found.");

        var attemptsUsed = (int)await _db.ChapterQuizAttempts
            .CountDocumentsAsync(a => a.UserId == userId && a.ChapterId == chapterId);
        if (chapter.MaxAttempts > 0 && attemptsUsed >= chapter.MaxAttempts)
            return ServiceResult<ChapterQuizResultDto>.Validation("No attempts remaining.");

        var answers = req.Answers ?? new();
        var byQuestion = answers.GroupBy(a => a.QuestionId).ToDictionary(g => g.Key, g => g.First());

        int total = ql.Questions.Count;
        int correct = ql.Questions.Count(q =>
            byQuestion.TryGetValue(q.Id, out var a) && Grading.IsCorrect(q, a.AnswerId, a.AnswerIds));
        int percent = Grading.Percent(correct, total);
        bool passed = percent >= chapter.PassThresholdPercent;
        int attemptNo = attemptsUsed + 1;

        await _db.ChapterQuizAttempts.InsertOneAsync(new ChapterQuizAttempt
        {
            UserId = userId,
            CourseId = course.Id,
            ChapterId = chapterId,
            QuestionListId = ql.Id,
            AttemptNo = attemptNo,
            CorrectCount = correct,
            TotalCount = total,
            Percent = percent,
            Passed = passed,
        });

        if (passed)
        {
            await MarkChapterQuizPassedAsync(userId, course.Id, chapterId);
            // F10: Kapitel-Quiz bestanden könnte den Kurs abschließen → Zertifikat prüfen.
            await _certs.CheckAndIssueAsync(userId, course.Id);
        }

        int remaining = chapter.MaxAttempts == 0 ? -1 : Math.Max(0, chapter.MaxAttempts - attemptNo);
        return ServiceResult<ChapterQuizResultDto>.Ok(
            Mappers.ToChapterQuizResultDto(ql, chapter, correct, percent, passed, attemptNo, remaining));
    }

    // ─── Helpers ────────────────────────────────────────────────────────────────

    private Task<Course> FindCourseByChapterAsync(string chapterId) =>
        _db.Courses.Find(c => c.Chapters.Any(ch => ch.Id == chapterId)).FirstOrDefaultAsync();

    private async Task<(int used, int? best, bool passed)> AttemptStatusAsync(string userId, string chapterId)
    {
        var attempts = await _db.ChapterQuizAttempts
            .Find(a => a.UserId == userId && a.ChapterId == chapterId)
            .ToListAsync();
        if (attempts.Count == 0) return (0, null, false);
        return (attempts.Count, attempts.Max(a => a.Percent), attempts.Any(a => a.Passed));
    }

    private async Task ClearQuizDataAsync(string questionListId, string chapterId)
    {
        await _db.QuestionLists.DeleteOneAsync(q => q.Id == questionListId);
        await _db.ChapterQuizAttempts.DeleteManyAsync(a => a.ChapterId == chapterId);
        // Bestandene-Markierungen clusterweit entfernen (Quiz wurde ersetzt/gelöscht).
        await _db.Progress.UpdateManyAsync(
            Builders<Progress>.Filter.AnyEq(p => p.PassedChapterQuizIds, chapterId),
            Builders<Progress>.Update.Pull(p => p.PassedChapterQuizIds, chapterId));
    }

    private async Task MarkChapterQuizPassedAsync(string userId, string courseId, string chapterId)
    {
        var progress = await _db.Progress
            .Find(p => p.UserId == userId && p.CourseId == courseId)
            .FirstOrDefaultAsync();
        if (progress is null)
        {
            progress = new Progress { UserId = userId, CourseId = courseId };
            progress.PassedChapterQuizIds.Add(chapterId);
            await _db.Progress.InsertOneAsync(progress);
            return;
        }
        await _db.Progress.UpdateOneAsync(
            p => p.Id == progress.Id,
            Builders<Progress>.Update
                .AddToSet(p => p.PassedChapterQuizIds, chapterId)
                .Set(p => p.LastVisited, DateTime.UtcNow));
    }
}
