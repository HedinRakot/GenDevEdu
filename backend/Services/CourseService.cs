using DevEdu.Api.Dtos;
using DevEdu.Api.Models;
using MongoDB.Driver;

namespace DevEdu.Api.Services;

public class CourseService
{
    private readonly MongoContext _db;

    public CourseService(MongoContext db) => _db = db;

    /// <summary>
    /// Lists courses visible to the caller: Learners see only Published; Authors/Admins
    /// additionally see their own Drafts (Admins see all non-published too).
    /// </summary>
    public async Task<List<CourseSummaryDto>> ListAsync(string userId, IReadOnlySet<string> roles)
    {
        var all = await _db.Courses.Find(FilterDefinition<Course>.Empty).ToListAsync();

        bool isAdmin = roles.Contains(Roles.Admin);
        bool isAuthor = roles.Contains(Roles.Author);

        var visible = all.Where(c =>
            c.Status == CourseStatus.Published ||
            isAdmin ||
            (isAuthor && c.AuthorId == userId));

        return visible
            .OrderBy(c => c.Title)
            .Select(Mappers.ToSummary)
            .ToList();
    }

    public async Task<ServiceResult<CourseTreeDto>> GetTreeAsync(string id, string userId, IReadOnlySet<string> roles)
    {
        var course = await _db.Courses.Find(c => c.Id == id).FirstOrDefaultAsync();
        if (course is null)
            return ServiceResult<CourseTreeDto>.NotFound("Course not found.");

        bool isAdmin = roles.Contains(Roles.Admin);
        bool isOwner = roles.Contains(Roles.Author) && course.AuthorId == userId;

        if (course.Status != CourseStatus.Published && !isAdmin && !isOwner)
            return ServiceResult<CourseTreeDto>.NotFound("Course not found.");

        // Author/Admin viewing → include correct answers; everyone else → stripped learner view.
        bool includeAnswers = isAdmin || isOwner;

        var questions = await _db.Questions.Find(q => q.CourseId == course.Id).ToListAsync();
        return ServiceResult<CourseTreeDto>.Ok(Mappers.ToTree(course, questions, includeAnswers));
    }

    public async Task<ServiceResult<CourseSummaryDto>> CreateAsync(CreateCourseRequest req, string authorId)
    {
        if (string.IsNullOrWhiteSpace(req.Title))
            return ServiceResult<CourseSummaryDto>.Validation("title is required.");

        var course = new Course
        {
            Title = req.Title.Trim(),
            Slug = Slug.From(req.Title),
            Description = req.Description ?? string.Empty,
            Tags = req.Tags ?? new List<string>(),
            Level = req.Level ?? string.Empty,
            Status = CourseStatus.Draft,
            AuthorId = authorId,
        };
        await _db.Courses.InsertOneAsync(course);
        return ServiceResult<CourseSummaryDto>.Ok(Mappers.ToSummary(course));
    }

    public async Task<ServiceResult<CourseSummaryDto>> UpdateAsync(string id, UpdateCourseRequest req, string userId, bool isAdmin)
    {
        var course = await _db.Courses.Find(c => c.Id == id).FirstOrDefaultAsync();
        if (course is null)
            return ServiceResult<CourseSummaryDto>.NotFound("Course not found.");
        if (!isAdmin && course.AuthorId != userId)
            return ServiceResult<CourseSummaryDto>.Forbidden("Not your course.");
        if (string.IsNullOrWhiteSpace(req.Title))
            return ServiceResult<CourseSummaryDto>.Validation("title is required.");

        course.Title = req.Title.Trim();
        course.Description = req.Description ?? course.Description;
        course.Tags = req.Tags ?? course.Tags;
        course.Level = req.Level ?? course.Level;
        course.UpdatedAt = DateTime.UtcNow;

        await _db.Courses.ReplaceOneAsync(c => c.Id == id, course);
        return ServiceResult<CourseSummaryDto>.Ok(Mappers.ToSummary(course));
    }

    public async Task<ServiceResult<CourseSummaryDto>> PublishAsync(string id, string userId, bool isAdmin)
    {
        var course = await _db.Courses.Find(c => c.Id == id).FirstOrDefaultAsync();
        if (course is null)
            return ServiceResult<CourseSummaryDto>.NotFound("Course not found.");
        if (!isAdmin && course.AuthorId != userId)
            return ServiceResult<CourseSummaryDto>.Forbidden("Not your course.");

        course.Status = CourseStatus.Published;
        course.UpdatedAt = DateTime.UtcNow;
        await _db.Courses.UpdateOneAsync(
            c => c.Id == id,
            Builders<Course>.Update
                .Set(c => c.Status, CourseStatus.Published)
                .Set(c => c.UpdatedAt, course.UpdatedAt));

        return ServiceResult<CourseSummaryDto>.Ok(Mappers.ToSummary(course));
    }

    // ---- nested content ----

    public async Task<ServiceResult<ChapterDto>> AddChapterAsync(string courseId, CreateChapterRequest req, string userId, bool isAdmin)
    {
        var course = await _db.Courses.Find(c => c.Id == courseId).FirstOrDefaultAsync();
        if (course is null)
            return ServiceResult<ChapterDto>.NotFound("Course not found.");
        if (!isAdmin && course.AuthorId != userId)
            return ServiceResult<ChapterDto>.Forbidden("Not your course.");
        if (string.IsNullOrWhiteSpace(req.Title))
            return ServiceResult<ChapterDto>.Validation("title is required.");

        var chapter = new Chapter
        {
            Title = req.Title.Trim(),
            Description = req.Description ?? string.Empty,
            Order = req.Order,
        };
        course.Chapters.Add(chapter);
        course.UpdatedAt = DateTime.UtcNow;
        await _db.Courses.ReplaceOneAsync(c => c.Id == courseId, course);

        return ServiceResult<ChapterDto>.Ok(
            new ChapterDto(chapter.Id, chapter.Title, chapter.Order, chapter.Description,
                new List<TopicDto>(), new List<object>()));
    }

    public async Task<ServiceResult<TopicDto>> AddTopicAsync(string chapterId, CreateTopicRequest req, string userId, bool isAdmin)
    {
        var course = await _db.Courses.Find(c => c.Chapters.Any(ch => ch.Id == chapterId)).FirstOrDefaultAsync();
        if (course is null)
            return ServiceResult<TopicDto>.NotFound("Chapter not found.");
        if (!isAdmin && course.AuthorId != userId)
            return ServiceResult<TopicDto>.Forbidden("Not your course.");
        if (string.IsNullOrWhiteSpace(req.Title))
            return ServiceResult<TopicDto>.Validation("title is required.");

        var chapter = course.Chapters.First(ch => ch.Id == chapterId);
        var topic = new Topic { Title = req.Title.Trim(), Order = req.Order };
        chapter.Topics.Add(topic);
        course.UpdatedAt = DateTime.UtcNow;
        await _db.Courses.ReplaceOneAsync(c => c.Id == course.Id, course);

        return ServiceResult<TopicDto>.Ok(
            new TopicDto(topic.Id, topic.Title, topic.Order, new List<ExampleDto>(), new List<object>()));
    }

    public async Task<ServiceResult<ExampleDto>> AddExampleAsync(string topicId, CreateExampleRequest req, string userId, bool isAdmin)
    {
        var course = await _db.Courses
            .Find(c => c.Chapters.Any(ch => ch.Topics.Any(t => t.Id == topicId)))
            .FirstOrDefaultAsync();
        if (course is null)
            return ServiceResult<ExampleDto>.NotFound("Topic not found.");
        if (!isAdmin && course.AuthorId != userId)
            return ServiceResult<ExampleDto>.Forbidden("Not your course.");
        if (string.IsNullOrWhiteSpace(req.Title))
            return ServiceResult<ExampleDto>.Validation("title is required.");

        var topic = course.Chapters.SelectMany(ch => ch.Topics).First(t => t.Id == topicId);

        var blocks = (req.ContentBlocks ?? new List<ContentBlockDto>())
            .Select(b => new ContentBlock
            {
                Kind = string.IsNullOrWhiteSpace(b.Kind) ? "markdown" : b.Kind,
                Text = b.Text ?? string.Empty,
                Language = b.Language,
            })
            .ToList();

        var example = new Example
        {
            Title = req.Title.Trim(),
            ContentBlocks = blocks,
            Language = req.Language,
            Order = req.Order,
        };
        topic.Examples.Add(example);
        course.UpdatedAt = DateTime.UtcNow;
        await _db.Courses.ReplaceOneAsync(c => c.Id == course.Id, course);

        return ServiceResult<ExampleDto>.Ok(Mappers.ToExampleDto(example));
    }

    /// <summary>Resolves the courseId that owns the given topic, or null.</summary>
    public async Task<Course?> FindCourseByTopicAsync(string topicId) =>
        await _db.Courses.Find(c => c.Chapters.Any(ch => ch.Topics.Any(t => t.Id == topicId))).FirstOrDefaultAsync();

    public async Task<Course?> FindCourseByChapterAsync(string chapterId) =>
        await _db.Courses.Find(c => c.Chapters.Any(ch => ch.Id == chapterId)).FirstOrDefaultAsync();
}
