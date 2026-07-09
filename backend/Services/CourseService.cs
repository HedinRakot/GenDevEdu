using DevEdu.Api.Dtos;
using DevEdu.Api.Models;
using MongoDB.Driver;

namespace DevEdu.Api.Services;

public class CourseService
{
    private readonly MongoContext _db;

    public CourseService(MongoContext db) => _db = db;

    // ─── Read ─────────────────────────────────────────────────────────────────

    public async Task<List<CourseDto>> ListAsync(
        string userId, IReadOnlySet<string> roles,
        string? search = null, List<string>? tags = null, string? level = null)
    {
        var all = await _db.Courses.Find(FilterDefinition<Course>.Empty).ToListAsync();

        bool isAdmin = roles.Contains(Roles.Admin);
        bool isAuthor = roles.Contains(Roles.Author);

        var visible = all
            .Where(c => c.Status == CourseStatus.Published || isAdmin || (isAuthor && c.AuthorId == userId));

        return CourseCatalog.Filter(visible, search, tags, level)
            .OrderBy(c => c.Name)
            .Select(Mappers.ToCourseDto)
            .ToList();
    }

    /// <summary>Distinkte Tags aller veröffentlichten Kurse (für die Filter-Chips).</summary>
    public async Task<List<string>> GetTagsAsync()
    {
        var published = await _db.Courses.Find(c => c.Status == CourseStatus.Published).ToListAsync();
        return published
            .SelectMany(c => c.Tags)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .OrderBy(t => t)
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
        var completedIds = (progress?.CompletedChapterContentIds ?? new()).ToHashSet();
        var passedQuizIds = (progress?.PassedChapterQuizIds ?? new()).ToHashSet();

        var chapters = course.Chapters
            .OrderBy(ch => ch.SortOrder)
            .Select(ch => Mappers.ToChapterResponseDto(ch) with
            {
                // F8: geteilte Abschluss-Logik (CourseCompletion).
                Completed = CourseCompletion.IsChapterComplete(ch, completedIds, passedQuizIds),
                QuizPassed = passedQuizIds.Contains(ch.Id),
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
            Tags = (req.Tags ?? new())
                .Select(t => t.Trim().ToLowerInvariant())
                .Where(t => t.Length > 0)
                .Distinct()
                .ToList(),
            Level = CourseLevel.IsValid(req.Level) ? req.Level! : string.Empty,
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
            // Ohne explizite Angabe ans Ende anhängen (Reihenfolge wird über
            // die Reorder-Endpoints gepflegt, nicht mehr per Zahlenfeld).
            SortOrder = req.SortOrder > 0
                ? req.SortOrder
                : (course.Chapters.Count == 0 ? 1 : course.Chapters.Max(ch => ch.SortOrder) + 1),
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
            // Ohne explizite Angabe ans Ende anhängen (analog AddChapterAsync).
            SortOrder = req.SortOrder > 0
                ? req.SortOrder
                : (chapter.ChapterContent.Count == 0 ? 1 : chapter.ChapterContent.Max(x => x.SortOrder) + 1),
        };
        chapter.ChapterContent.Add(cc);
        course.UpdatedAt = DateTime.UtcNow;
        await _db.Courses.ReplaceOneAsync(c => c.Id == course.Id, course);

        return ServiceResult<ChapterContentDto>.Ok(Mappers.ToChapterContentDto(cc));
    }

    public async Task<ServiceResult<ChapterContentDto>> UpdateChapterContentAsync(
        string contentId, CreateChapterContentRequest req, string userId, bool isAdmin)
    {
        var course = await _db.Courses
            .Find(c => c.Chapters.Any(ch => ch.ChapterContent.Any(cc => cc.Id == contentId)))
            .FirstOrDefaultAsync();
        if (course is null)
            return ServiceResult<ChapterContentDto>.NotFound("ChapterContent not found.");
        if (!isAdmin && course.AuthorId != userId)
            return ServiceResult<ChapterContentDto>.Forbidden("Not your course.");
        if (string.IsNullOrWhiteSpace(req.Name))
            return ServiceResult<ChapterContentDto>.Validation("name is required.");

        var chapter = course.Chapters.First(ch => ch.ChapterContent.Any(cc => cc.Id == contentId));
        var cc = chapter.ChapterContent.First(c => c.Id == contentId);

        // Identität + Verknüpfungen bleiben erhalten (Id/ElementId/CourseId/ChapterId/QuestionListId).
        cc.Name = req.Name.Trim();
        cc.Titel = Mappers.BuildTexte(req.TitelItems, req.Name);
        cc.ContentType = (ChapterContentType)req.ContentType;
        cc.LessonText = req.LessonText ?? string.Empty;
        cc.LessonTexte = Mappers.BuildTexte(req.LessonTexteItems, string.Empty);
        cc.VideoUrl = req.VideoUrl ?? string.Empty;
        // Position bleibt erhalten, wenn der Request keine (positive) SortOrder
        // mitschickt — die Reihenfolge wird über die Reorder-Endpoints gepflegt.
        if (req.SortOrder > 0)
            cc.SortOrder = req.SortOrder;

        course.UpdatedAt = DateTime.UtcNow;
        await _db.Courses.ReplaceOneAsync(c => c.Id == course.Id, course);

        return ServiceResult<ChapterContentDto>.Ok(Mappers.ToChapterContentDto(cc));
    }

    // ─── Reorder (Author/Admin) ───────────────────────────────────────────────

    /// <summary>Setzt die Kapitel-Reihenfolge: SortOrder = Position in OrderedIds.</summary>
    public async Task<ServiceResult<bool>> ReorderChaptersAsync(
        string courseId, ReorderRequest req, string userId, bool isAdmin)
    {
        var course = await _db.Courses.Find(c => c.Id == courseId).FirstOrDefaultAsync();
        if (course is null)
            return ServiceResult<bool>.NotFound("Course not found.");
        if (!isAdmin && course.AuthorId != userId)
            return ServiceResult<bool>.Forbidden("Not your course.");

        var error = ApplyOrder(course.Chapters, req.OrderedIds,
            ch => ch.Id, ch => ch.ElementId, (ch, i) => ch.SortOrder = i);
        if (error is not null)
            return ServiceResult<bool>.Validation(error);

        course.UpdatedAt = DateTime.UtcNow;
        await _db.Courses.ReplaceOneAsync(c => c.Id == course.Id, course);
        return ServiceResult<bool>.Ok(true);
    }

    /// <summary>Setzt die Inhalts-Reihenfolge eines Kapitels analog zu den Kapiteln.</summary>
    public async Task<ServiceResult<bool>> ReorderChapterContentAsync(
        string chapterId, ReorderRequest req, string userId, bool isAdmin)
    {
        var course = await _db.Courses
            .Find(c => c.Chapters.Any(ch => ch.Id == chapterId || ch.ElementId == chapterId))
            .FirstOrDefaultAsync();
        if (course is null)
            return ServiceResult<bool>.NotFound("Chapter not found.");
        if (!isAdmin && course.AuthorId != userId)
            return ServiceResult<bool>.Forbidden("Not your course.");

        var chapter = course.Chapters.First(ch => ch.Id == chapterId || ch.ElementId == chapterId);
        var error = ApplyOrder(chapter.ChapterContent, req.OrderedIds,
            cc => cc.Id, cc => cc.ElementId, (cc, i) => cc.SortOrder = i);
        if (error is not null)
            return ServiceResult<bool>.Validation(error);

        course.UpdatedAt = DateTime.UtcNow;
        await _db.Courses.ReplaceOneAsync(c => c.Id == course.Id, course);
        return ServiceResult<bool>.Ok(true);
    }

    /// <summary>
    /// Wendet eine vollständige Neuordnung an: Jedes Element muss genau einmal in
    /// orderedIds vorkommen (per Id oder ElementId). Liefert null bei Erfolg,
    /// sonst die Validierungsmeldung.
    /// </summary>
    private static string? ApplyOrder<T>(
        List<T> items, List<string>? orderedIds,
        Func<T, string> id, Func<T, string> elementId, Action<T, int> setSortOrder)
    {
        var ids = orderedIds ?? new List<string>();
        if (ids.Count != items.Count || ids.Distinct().Count() != ids.Count)
            return "orderedIds must contain every element exactly once.";

        // 1-basiert, konsistent zu Bestandsdaten und zur Append-Logik (max+1).
        var position = ids.Select((value, index) => (value, index))
            .ToDictionary(x => x.value, x => x.index + 1);
        foreach (var item in items)
        {
            if (position.TryGetValue(id(item), out var byId))
                setSortOrder(item, byId);
            else if (position.TryGetValue(elementId(item), out var byElementId))
                setSortOrder(item, byElementId);
            else
                return "orderedIds must contain every element exactly once.";
        }
        return null;
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
