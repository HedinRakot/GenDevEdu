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

    public async Task<ServiceResult<QuestionAuthorDto>> AddTopicQuestionAsync(
        string topicId, CreateQuestionRequest req, string userId, bool isAdmin)
    {
        var course = await _courses.FindCourseByTopicAsync(topicId);
        if (course is null)
            return ServiceResult<QuestionAuthorDto>.NotFound("Topic not found.");
        if (!isAdmin && course.AuthorId != userId)
            return ServiceResult<QuestionAuthorDto>.Forbidden("Not your course.");

        return await BuildAndInsertAsync(req, course.Id, QuestionScope.Topic, topicId, null);
    }

    public async Task<ServiceResult<QuestionAuthorDto>> AddChapterQuestionAsync(
        string chapterId, CreateQuestionRequest req, string userId, bool isAdmin)
    {
        var course = await _courses.FindCourseByChapterAsync(chapterId);
        if (course is null)
            return ServiceResult<QuestionAuthorDto>.NotFound("Chapter not found.");
        if (!isAdmin && course.AuthorId != userId)
            return ServiceResult<QuestionAuthorDto>.Forbidden("Not your course.");

        return await BuildAndInsertAsync(req, course.Id, QuestionScope.Chapter, null, chapterId);
    }

    private async Task<ServiceResult<QuestionAuthorDto>> BuildAndInsertAsync(
        CreateQuestionRequest req, string courseId, string scope, string? topicId, string? chapterId)
    {
        if (string.IsNullOrWhiteSpace(req.Prompt))
            return ServiceResult<QuestionAuthorDto>.Validation("prompt is required.");

        var type = req.Type;
        if (type != QuestionType.SingleChoice && type != QuestionType.MultipleChoice && type != QuestionType.TrueFalse)
            return ServiceResult<QuestionAuthorDto>.Validation("type must be SingleChoice, MultipleChoice or TrueFalse.");

        var q = new Question
        {
            CourseId = courseId,
            Scope = scope,
            TopicId = topicId,
            ChapterId = chapterId,
            Type = type,
            Prompt = req.Prompt.Trim(),
            Explanation = req.Explanation,
            Points = req.Points > 0 ? req.Points : 1,
            Difficulty = string.IsNullOrWhiteSpace(req.Difficulty) ? "Easy" : req.Difficulty,
        };

        if (type is QuestionType.SingleChoice or QuestionType.MultipleChoice)
        {
            var options = req.Options ?? new List<OptionDto>();
            if (options.Count < 2)
                return ServiceResult<QuestionAuthorDto>.Validation("At least two options are required.");

            // Re-key options server-side so ids are stable & non-empty.
            var modelOptions = options.Select(o => new QuestionOption
            {
                Id = string.IsNullOrWhiteSpace(o.Id) ? Guid.NewGuid().ToString("N") : o.Id,
                Text = o.Text ?? string.Empty,
            }).ToList();
            q.Options = modelOptions;
            var optionIds = modelOptions.Select(o => o.Id).ToHashSet();

            if (type == QuestionType.SingleChoice)
            {
                if (string.IsNullOrWhiteSpace(req.CorrectOptionId) || !optionIds.Contains(req.CorrectOptionId))
                    return ServiceResult<QuestionAuthorDto>.Validation("correctOptionId must reference an option.");
                q.CorrectOptionId = req.CorrectOptionId;
            }
            else
            {
                var correct = (req.CorrectOptionIds ?? new List<string>()).Distinct().ToList();
                if (correct.Count == 0 || correct.Any(id => !optionIds.Contains(id)))
                    return ServiceResult<QuestionAuthorDto>.Validation("correctOptionIds must reference options.");
                q.CorrectOptionIds = correct;
            }
        }
        else // TrueFalse
        {
            if (req.CorrectAnswer is null)
                return ServiceResult<QuestionAuthorDto>.Validation("correctAnswer is required for TrueFalse.");
            q.CorrectAnswer = req.CorrectAnswer;
        }

        await _db.Questions.InsertOneAsync(q);
        return ServiceResult<QuestionAuthorDto>.Ok(Mappers.ToAuthorQuestion(q));
    }

    public async Task<ServiceResult<AttemptResultDto>> GradeAttemptAsync(
        string questionId, AttemptRequest req, string userId)
    {
        var q = await _db.Questions.Find(x => x.Id == questionId).FirstOrDefaultAsync();
        if (q is null)
            return ServiceResult<AttemptResultDto>.NotFound("Question not found.");
        if (req.Answer is null)
            return ServiceResult<AttemptResultDto>.Validation("answer is required.");

        bool isCorrect;
        var a = req.Answer;

        switch (q.Type)
        {
            case QuestionType.SingleChoice:
                if (string.IsNullOrWhiteSpace(a.SelectedOptionId))
                    return ServiceResult<AttemptResultDto>.Validation("selectedOptionId is required.");
                isCorrect = a.SelectedOptionId == q.CorrectOptionId;
                break;

            case QuestionType.MultipleChoice:
                if (a.SelectedOptionIds is null)
                    return ServiceResult<AttemptResultDto>.Validation("selectedOptionIds is required.");
                var selected = a.SelectedOptionIds.Distinct().ToHashSet();
                isCorrect = selected.SetEquals(q.CorrectOptionIds);
                break;

            case QuestionType.TrueFalse:
                if (a.Value is null)
                    return ServiceResult<AttemptResultDto>.Validation("value is required.");
                isCorrect = a.Value == q.CorrectAnswer;
                break;

            default:
                return ServiceResult<AttemptResultDto>.Validation("Unsupported question type.");
        }

        var score = isCorrect ? q.Points : 0;

        await _db.Attempts.InsertOneAsync(new Attempt
        {
            UserId = userId,
            QuestionId = q.Id,
            CourseId = q.CourseId,
            IsCorrect = isCorrect,
            Score = score,
        });

        return ServiceResult<AttemptResultDto>.Ok(new AttemptResultDto(isCorrect, score, q.Explanation));
    }
}
