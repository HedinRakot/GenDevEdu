using DevEdu.Api.Dtos;
using DevEdu.Api.Models;
using MongoDB.Driver;

namespace DevEdu.Api.Services;

public class CourseService
{
    private readonly MongoContext _db;

    public CourseService(MongoContext db) => _db = db;

    // ─── Read ─────────────────────────────────────────────────────────────────

    public async Task<List<CourseDto>> ListAsync(string userId, IReadOnlySet<string> roles)
    {
        var all = await _db.Courses.Find(FilterDefinition<Course>.Empty).ToListAsync();

        bool isAdmin = roles.Contains(Roles.Admin);
        bool isAuthor = roles.Contains(Roles.Author);

        return all
            .Where(c => c.Status == CourseStatus.Published || isAdmin || (isAuthor && c.AuthorId == userId))
            .OrderBy(c => c.Name)
            .Select(Mappers.ToCourseDto)
            .ToList();
    }

    public async Task<ServiceResult<ChapterListModel>> GetChaptersAsync(
        string courseId, string userId, IReadOnlySet<string> roles)
    {
        var course = await _db.Courses.Find(c => c.Id == courseId || c.ElementId == courseId)
            .FirstOrDefaultAsync();
        if (course is null)
            return ServiceResult<ChapterListModel>.NotFound("Course not found.");

        bool isAdmin = roles.Contains(Roles.Admin);
        bool isOwner = roles.Contains(Roles.Author) && course.AuthorId == userId;
        if (course.Status != CourseStatus.Published && !isAdmin && !isOwner)
            return ServiceResult<ChapterListModel>.NotFound("Course not found.");

        var progress = await _db.Progress
            .Find(p => p.UserId == userId && p.CourseId == course.Id)
            .FirstOrDefaultAsync();
        var completedIds = progress?.CompletedChapterContentIds ?? new List<string>();
        var passedQuizIds = progress?.PassedChapterQuizIds ?? new List<string>();

        var chapters = course.Chapters
            .OrderBy(ch => ch.SortOrder)
            .Select(ch =>
            {
                bool hasQuiz = !string.IsNullOrEmpty(ch.ChapterQuizId);
                bool quizPassed = passedQuizIds.Contains(ch.Id);
                bool contentDone = ch.ChapterContent.All(cc => completedIds.Contains(cc.ElementId));
                bool hasAny = ch.ChapterContent.Count > 0 || hasQuiz;
                // F8: Kapitel gilt erst als abgeschlossen, wenn alle Inhalte fertig sind
                // UND (falls vorhanden) das Abschlussquiz bestanden ist.
                bool completed = hasAny && contentDone && (!hasQuiz || quizPassed);
                return Mappers.ToChapterResponseDto(ch) with { Completed = completed, QuizPassed = quizPassed };
            })
            .ToList();

        return ServiceResult<ChapterListModel>.Ok(
            new ChapterListModel(course.Id, Mappers.PrimaryText(course.Titel), chapters));
    }

    public async Task<ServiceResult<ChapterContentListModel>> GetChapterContentAsync(
        string chapterId, string userId, IReadOnlySet<string> roles)
    {
        var course = await _db.Courses
            .Find(c => c.Chapters.Any(ch => ch.Id == chapterId || ch.ElementId == chapterId))
            .FirstOrDefaultAsync();
        if (course is null)
            return ServiceResult<ChapterContentListModel>.NotFound("Chapter not found.");

        bool isAdmin = roles.Contains(Roles.Admin);
        bool isOwner = roles.Contains(Roles.Author) && course.AuthorId == userId;
        if (course.Status != CourseStatus.Published && !isAdmin && !isOwner)
            return ServiceResult<ChapterContentListModel>.NotFound("Chapter not found.");

        var chapter = course.Chapters.First(ch => ch.Id == chapterId || ch.ElementId == chapterId);
        var content = chapter.ChapterContent
            .OrderBy(cc => cc.SortOrder)
            .Select(Mappers.ToChapterContentDto)
            .ToList();

        return ServiceResult<ChapterContentListModel>.Ok(
            new ChapterContentListModel(course.Id, chapter.Id,
                Mappers.PrimaryText(chapter.Titel), content));
    }

    // ─── Write (Author/Admin) ─────────────────────────────────────────────────

    public async Task<ServiceResult<CourseDto>> CreateAsync(CreateCourseRequest req, string authorId)
    {
        if (string.IsNullOrWhiteSpace(req.Name))
            return ServiceResult<CourseDto>.Validation("name is required.");

        var id = Guid.NewGuid().ToString("N");
        var course = new Course
        {
            Id = id,
            ElementId = id,
            Name = req.Name.Trim(),
            Titel = Mappers.BuildTexte(req.TitelItems, req.Name),
            AuthorId = authorId,
            Status = CourseStatus.Draft,
        };
        await _db.Courses.InsertOneAsync(course);
        return ServiceResult<CourseDto>.Ok(Mappers.ToCourseDto(course));
    }

    public async Task<ServiceResult<CourseDto>> PublishAsync(string courseId, string userId, bool isAdmin)
    {
        var course = await _db.Courses.Find(c => c.Id == courseId).FirstOrDefaultAsync();
        if (course is null)
            return ServiceResult<CourseDto>.NotFound("Course not found.");
        if (!isAdmin && course.AuthorId != userId)
            return ServiceResult<CourseDto>.Forbidden("Not your course.");

        await _db.Courses.UpdateOneAsync(
            c => c.Id == courseId,
            Builders<Course>.Update
                .Set(c => c.Status, CourseStatus.Published)
                .Set(c => c.UpdatedAt, DateTime.UtcNow));

        course.Status = CourseStatus.Published;
        return ServiceResult<CourseDto>.Ok(Mappers.ToCourseDto(course));
    }

    public async Task<ServiceResult<ChapterResponseDto>> AddChapterAsync(
        string courseId, CreateChapterRequest req, string userId, bool isAdmin)
    {
        var course = await _db.Courses.Find(c => c.Id == courseId).FirstOrDefaultAsync();
        if (course is null)
            return ServiceResult<ChapterResponseDto>.NotFound("Course not found.");
        if (!isAdmin && course.AuthorId != userId)
            return ServiceResult<ChapterResponseDto>.Forbidden("Not your course.");
        if (string.IsNullOrWhiteSpace(req.Name))
            return ServiceResult<ChapterResponseDto>.Validation("name is required.");

        var id = Guid.NewGuid().ToString("N");
        var chapter = new Chapter
        {
            Id = id,
            ElementId = id,
            Name = req.Name.Trim(),
            CourseId = courseId,
            Titel = Mappers.BuildTexte(req.TitelItems, req.Name),
            SortOrder = req.SortOrder,
            Show = req.Show,
        };
        course.Chapters.Add(chapter);
        course.UpdatedAt = DateTime.UtcNow;
        await _db.Courses.ReplaceOneAsync(c => c.Id == courseId, course);

        return ServiceResult<ChapterResponseDto>.Ok(Mappers.ToChapterResponseDto(chapter));
    }

    public async Task<ServiceResult<ChapterContentDto>> AddChapterContentAsync(
        string chapterId, CreateChapterContentRequest req, string userId, bool isAdmin)
    {
        var course = await _db.Courses
            .Find(c => c.Chapters.Any(ch => ch.Id == chapterId))
            .FirstOrDefaultAsync();
        if (course is null)
            return ServiceResult<ChapterContentDto>.NotFound("Chapter not found.");
        if (!isAdmin && course.AuthorId != userId)
            return ServiceResult<ChapterContentDto>.Forbidden("Not your course.");
        if (string.IsNullOrWhiteSpace(req.Name))
            return ServiceResult<ChapterContentDto>.Validation("name is required.");

        var chapter = course.Chapters.First(ch => ch.Id == chapterId);
        var id = Guid.NewGuid().ToString("N");
        var cc = new ChapterContent
        {
            Id = id,
            ElementId = id,
            Name = req.Name.Trim(),
            CourseId = course.Id,
            ChapterId = chapterId,
            Titel = Mappers.BuildTexte(req.TitelItems, req.Name),
            ContentType = (ChapterContentType)req.ContentType,
            LessonText = req.LessonText ?? string.Empty,
            LessonTexte = Mappers.BuildTexte(req.LessonTexteItems, string.Empty),
            VideoUrl = req.VideoUrl ?? string.Empty,
            SortOrder = req.SortOrder,
        };
        chapter.ChapterContent.Add(cc);
        course.UpdatedAt = DateTime.UtcNow;
        await _db.Courses.ReplaceOneAsync(c => c.Id == course.Id, course);

        return ServiceResult<ChapterContentDto>.Ok(Mappers.ToChapterContentDto(cc));
    }

    // ─── Delete (Author/Admin) ────────────────────────────────────────────────

    public async Task<ServiceResult<bool>> DeleteCourseAsync(string courseId, string userId, bool isAdmin)
    {
        var course = await _db.Courses.Find(c => c.Id == courseId).FirstOrDefaultAsync();
        if (course is null)
            return ServiceResult<bool>.NotFound("Course not found.");
        if (!isAdmin && course.AuthorId != userId)
            return ServiceResult<bool>.Forbidden("Not your course.");

        await _db.Courses.DeleteOneAsync(c => c.Id == course.Id);

        // Cascade: alle abhängigen Dokumente des Kurses entfernen.
        await _db.QuestionLists.DeleteManyAsync(q => q.CourseId == course.Id);
        await _db.Attempts.DeleteManyAsync(a => a.CourseId == course.Id);
        await _db.ChapterQuizAttempts.DeleteManyAsync(a => a.CourseId == course.Id);
        await _db.Progress.DeleteManyAsync(p => p.CourseId == course.Id);
        await _db.Enrollments.DeleteManyAsync(e => e.CourseId == course.Id);

        return ServiceResult<bool>.Ok(true);
    }

    public async Task<ServiceResult<bool>> DeleteChapterAsync(string chapterId, string userId, bool isAdmin)
    {
        var course = await _db.Courses
            .Find(c => c.Chapters.Any(ch => ch.Id == chapterId))
            .FirstOrDefaultAsync();
        if (course is null)
            return ServiceResult<bool>.NotFound("Chapter not found.");
        if (!isAdmin && course.AuthorId != userId)
            return ServiceResult<bool>.Forbidden("Not your course.");

        var chapter = course.Chapters.First(ch => ch.Id == chapterId);
        var questionListIds = chapter.ChapterContent
            .Select(cc => cc.QuestionListId)
            .Where(qlId => !string.IsNullOrEmpty(qlId))
            .ToList();
        if (!string.IsNullOrEmpty(chapter.ChapterQuizId))
            questionListIds.Add(chapter.ChapterQuizId);

        course.Chapters.RemoveAll(ch => ch.Id == chapterId);
        course.UpdatedAt = DateTime.UtcNow;
        await _db.Courses.ReplaceOneAsync(c => c.Id == course.Id, course);

        if (questionListIds.Count > 0)
            await _db.QuestionLists.DeleteManyAsync(q => questionListIds.Contains(q.Id));
        await _db.ChapterQuizAttempts.DeleteManyAsync(a => a.ChapterId == chapterId);

        return ServiceResult<bool>.Ok(true);
    }

    public async Task<ServiceResult<bool>> DeleteChapterContentAsync(string contentId, string userId, bool isAdmin)
    {
        var course = await _db.Courses
            .Find(c => c.Chapters.Any(ch => ch.ChapterContent.Any(cc => cc.Id == contentId)))
            .FirstOrDefaultAsync();
        if (course is null)
            return ServiceResult<bool>.NotFound("ChapterContent not found.");
        if (!isAdmin && course.AuthorId != userId)
            return ServiceResult<bool>.Forbidden("Not your course.");

        var chapter = course.Chapters.First(ch => ch.ChapterContent.Any(cc => cc.Id == contentId));
        var content = chapter.ChapterContent.First(cc => cc.Id == contentId);
        var questionListId = content.QuestionListId;

        chapter.ChapterContent.RemoveAll(cc => cc.Id == contentId);
        course.UpdatedAt = DateTime.UtcNow;
        await _db.Courses.ReplaceOneAsync(c => c.Id == course.Id, course);

        if (!string.IsNullOrEmpty(questionListId))
            await _db.QuestionLists.DeleteOneAsync(q => q.Id == questionListId);

        return ServiceResult<bool>.Ok(true);
    }

    // ─── Lookup helpers (used by QuestionService / EnrollmentService) ─────────

    public async Task<Course?> FindCourseByChapterAsync(string chapterId) =>
        await _db.Courses.Find(c => c.Chapters.Any(ch => ch.Id == chapterId)).FirstOrDefaultAsync();

    public async Task<Course?> FindCourseByChapterContentAsync(string chapterContentId) =>
        await _db.Courses
            .Find(c => c.Chapters.Any(ch => ch.ChapterContent.Any(cc => cc.Id == chapterContentId)))
            .FirstOrDefaultAsync();
}
