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

        var validationError = ValidateAnswer(q, req.Answer);
        if (validationError is not null)
            return ServiceResult<AttemptResultDto>.Validation(validationError);

        var (isCorrect, score) = Grade(q, req.Answer);

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

    public async Task<ServiceResult<ChapterQuizResultDto>> SubmitChapterQuizAsync(
        string chapterId, SubmitChapterQuizRequest req, string userId)
    {
        if (req.Answers is null || req.Answers.Count == 0)
            return ServiceResult<ChapterQuizResultDto>.Validation("answers is required.");

        var course = await _db.Courses
            .Find(c => c.Chapters.Any(ch => ch.Id == chapterId))
            .FirstOrDefaultAsync();
        if (course is null)
            return ServiceResult<ChapterQuizResultDto>.NotFound("Chapter not found.");

        var questions = await _db.Questions
            .Find(q => q.ChapterId == chapterId && q.Scope == QuestionScope.Chapter)
            .ToListAsync();
        if (questions.Count == 0)
            return ServiceResult<ChapterQuizResultDto>.Validation("No quiz questions found for this chapter.");

        const int PassingThresholdPct = 70;
        int totalPoints = questions.Sum(q => q.Points);
        int earnedPoints = 0;
        var results = new List<QuizAnswerResultDto>();

        foreach (var q in questions)
        {
            var submitted = req.Answers.FirstOrDefault(a => a.QuestionId == q.Id);
            if (submitted?.Answer is null)
            {
                results.Add(new QuizAnswerResultDto(q.Id, false, 0, q.Explanation));
                continue;
            }

            var (isCorrect, score) = Grade(q, submitted.Answer);
            earnedPoints += score;
            results.Add(new QuizAnswerResultDto(q.Id, isCorrect, score, q.Explanation));

            await _db.Attempts.InsertOneAsync(new Attempt
            {
                UserId = userId,
                QuestionId = q.Id,
                CourseId = course.Id,
                IsCorrect = isCorrect,
                Score = score,
            });
        }

        bool passed = totalPoints > 0 && (earnedPoints * 100 / totalPoints) >= PassingThresholdPct;

        // Persist / overwrite the chapter quiz result inside the progress document.
        var progress = await _db.Progress
            .Find(p => p.UserId == userId && p.CourseId == course.Id)
            .FirstOrDefaultAsync();
        if (progress is null)
        {
            progress = new Progress { UserId = userId, CourseId = course.Id };
            await _db.Progress.InsertOneAsync(progress);
        }

        progress.ChapterQuizResults.RemoveAll(r => r.ChapterId == chapterId);
        progress.ChapterQuizResults.Add(new ChapterQuizResult
        {
            ChapterId = chapterId,
            EarnedPoints = earnedPoints,
            TotalPoints = totalPoints,
            PassingThresholdPct = PassingThresholdPct,
            Passed = passed,
        });

        await _db.Progress.ReplaceOneAsync(p => p.Id == progress.Id, progress);

        return ServiceResult<ChapterQuizResultDto>.Ok(
            new ChapterQuizResultDto(chapterId, earnedPoints, totalPoints, PassingThresholdPct, passed, results));
    }

    private static string? ValidateAnswer(Question q, AnswerDto a) => q.Type switch
    {
        QuestionType.SingleChoice when string.IsNullOrWhiteSpace(a.SelectedOptionId)
            => "selectedOptionId is required.",
        QuestionType.MultipleChoice when a.SelectedOptionIds is null
            => "selectedOptionIds is required.",
        QuestionType.TrueFalse when a.Value is null
            => "value is required.",
        _ => null,
    };

    private static (bool isCorrect, int score) Grade(Question q, AnswerDto a)
    {
        bool isCorrect = q.Type switch
        {
            QuestionType.SingleChoice => a.SelectedOptionId == q.CorrectOptionId,
            QuestionType.MultipleChoice => a.SelectedOptionIds is not null &&
                a.SelectedOptionIds.Distinct().ToHashSet()
                    .SetEquals(q.CorrectOptionIds ?? new List<string>()),
            QuestionType.TrueFalse => a.Value == q.CorrectAnswer,
            _ => false,
        };
        return (isCorrect, isCorrect ? q.Points : 0);
    }
}
