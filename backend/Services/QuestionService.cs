using DevEdu.Api.Dtos;
using DevEdu.Api.Models;
using MongoDB.Driver;

namespace DevEdu.Api.Services;

public class QuestionService
{
    private readonly MongoContext _db;
    private readonly CourseService _courses;

    public QuestionService(MongoContext db, CourseService courses)
    {
        _db = db;
        _courses = courses;
    }

    // ─── Read ─────────────────────────────────────────────────────────────────

    public async Task<ServiceResult<QuestionListResponseModel>> GetQuestionListAsync(
        string questionListId, string userId, IReadOnlySet<string> roles)
    {
        var ql = await _db.QuestionLists.Find(x => x.Id == questionListId).FirstOrDefaultAsync();
        if (ql is null)
            return ServiceResult<QuestionListResponseModel>.NotFound("QuestionList not found.");

        bool isAdmin = roles.Contains(Roles.Admin);
        bool revealAnswers = isAdmin;

        if (!revealAnswers && roles.Contains(Roles.Author))
        {
            var course = await _db.Courses.Find(c => c.Id == ql.CourseId).FirstOrDefaultAsync();
            revealAnswers = course is not null && course.AuthorId == userId;
        }

        return ServiceResult<QuestionListResponseModel>.Ok(Mappers.ToQuestionListModel(ql, revealAnswers));
    }

    // ─── Write (Author/Admin) ─────────────────────────────────────────────────

    public async Task<ServiceResult<QuestionListResponseModel>> CreateQuestionListAsync(
        CreateQuestionListRequest req, string userId, bool isAdmin)
    {
        if (string.IsNullOrWhiteSpace(req.ChapterContentId))
            return ServiceResult<QuestionListResponseModel>.Validation("chapterContentId is required.");

        var course = await _courses.FindCourseByChapterContentAsync(req.ChapterContentId);
        if (course is null)
            return ServiceResult<QuestionListResponseModel>.NotFound("ChapterContent not found.");
        if (!isAdmin && course.AuthorId != userId)
            return ServiceResult<QuestionListResponseModel>.Forbidden("Not your course.");

        var questions = (req.Questions ?? new()).Select(Mappers.ToQuestion).ToList();

        var qlId = Guid.NewGuid().ToString("N");
        var ql = new QuestionList
        {
            Id = qlId,
            ElementId = qlId,
            CourseId = course.Id,
            ChapterContentId = req.ChapterContentId,
            Questions = questions,
        };

        await _db.QuestionLists.InsertOneAsync(ql);

        // Back-link: QuestionListId in the owning ChapterContent
        var chapter = course.Chapters
            .FirstOrDefault(ch => ch.ChapterContent.Any(cc => cc.Id == req.ChapterContentId));
        if (chapter is not null)
        {
            var cc = chapter.ChapterContent.First(c => c.Id == req.ChapterContentId);
            cc.QuestionListId = qlId;
            await _db.Courses.ReplaceOneAsync(c => c.Id == course.Id, course);
        }

        return ServiceResult<QuestionListResponseModel>.Ok(Mappers.ToQuestionListModel(ql, true));
    }

    // ─── Attempt ──────────────────────────────────────────────────────────────

    public async Task<ServiceResult<AttemptResultDto>> GradeAttemptAsync(
        string questionId, SubmitAttemptRequest req, string userId)
    {
        var ql = await _db.QuestionLists
            .Find(x => x.Questions.Any(q => q.Id == questionId))
            .FirstOrDefaultAsync();
        if (ql is null)
            return ServiceResult<AttemptResultDto>.NotFound("Question not found.");

        var q = ql.Questions.First(x => x.Id == questionId);

        bool isCorrect = Grading.IsCorrect(q, req.AnswerId, req.AnswerIds);
        var score = isCorrect ? 1 : 0;

        await _db.Attempts.InsertOneAsync(new Attempt
        {
            UserId = userId,
            QuestionId = questionId,
            CourseId = ql.CourseId,
            IsCorrect = isCorrect,
            Score = score,
        });

        var revealedAnswers = q.Answers.Select(a => Mappers.ToAnswerDto(a, reveal: true)).ToList();
        return ServiceResult<AttemptResultDto>.Ok(new AttemptResultDto(isCorrect, score, revealedAnswers));
    }
}
