using System.Text;
using DevEdu.Api.Dtos;
using DevEdu.Api.Models;
using DevEdu.Api.Services.CodeExecution;
using MongoDB.Driver;

namespace DevEdu.Api.Services;

public class CodeSubmissionService
{
    private readonly MongoContext _db;
    private readonly ICodeSubmissionQueue _queue;
    private readonly SandboxOptions _options;

    public CodeSubmissionService(MongoContext db, ICodeSubmissionQueue queue, SandboxOptions options)
    {
        _db = db;
        _queue = queue;
        _options = options;
    }

    // ─── Einreichen ────────────────────────────────────────────────────────────

    public async Task<ServiceResult<CodeSubmissionAcceptedDto>> SubmitAsync(
        SubmitCodeRequest req, string userId)
    {
        if (string.IsNullOrWhiteSpace(req.QuestionId))
            return ServiceResult<CodeSubmissionAcceptedDto>.Validation("questionId is required.");
        if (string.IsNullOrEmpty(req.Code))
            return ServiceResult<CodeSubmissionAcceptedDto>.Validation("code is required.");
        if (Encoding.UTF8.GetByteCount(req.Code) > _options.CodeSizeLimitBytes)
            return ServiceResult<CodeSubmissionAcceptedDto>.Validation(
                $"code exceeds {_options.CodeSizeLimitBytes} bytes.");

        var ql = await _db.QuestionLists
            .Find(x => x.Questions.Any(q => q.Id == req.QuestionId))
            .FirstOrDefaultAsync();
        if (ql is null)
            return ServiceResult<CodeSubmissionAcceptedDto>.NotFound("Question not found.");

        var q = ql.Questions.First(x => x.Id == req.QuestionId);
        if (q.QuestionType != MobileQuestionType.Code || q.Code is null)
            return ServiceResult<CodeSubmissionAcceptedDto>.Validation("Question is not a code task.");

        var submission = new CodeSubmission
        {
            UserId = userId,
            QuestionId = req.QuestionId,
            CourseId = ql.CourseId,
            Language = q.Code.Language,
            SubmittedCode = req.Code,
            Status = CodeSubmissionStatus.Queued,
            TotalCount = q.Code.TestCases.Count,
        };

        await _db.CodeSubmissions.InsertOneAsync(submission);
        await _queue.EnqueueAsync(submission.Id);

        return ServiceResult<CodeSubmissionAcceptedDto>.Ok(
            new CodeSubmissionAcceptedDto(submission.Id, submission.Status.ToString()));
    }

    // ─── Ergebnis abrufen ────────────────────────────────────────────────────────

    public async Task<ServiceResult<CodeSubmissionResultDto>> GetAsync(
        string submissionId, string userId, IReadOnlySet<string> roles)
    {
        var sub = await _db.CodeSubmissions.Find(x => x.Id == submissionId).FirstOrDefaultAsync();
        if (sub is null)
            return ServiceResult<CodeSubmissionResultDto>.NotFound("Submission not found.");

        bool isOwner = sub.UserId == userId;
        bool isAdmin = roles.Contains(Roles.Admin);

        // Reveal (Lösungs-/Hidden-Testfall-I/O sichtbar) NUR für Autor/Admin – der
        // Lerner-Eigentümer sieht versteckte Testfälle bewusst nicht.
        bool reveal = isAdmin;
        if (!reveal && roles.Contains(Roles.Author))
        {
            var course = await _db.Courses.Find(c => c.Id == sub.CourseId).FirstOrDefaultAsync();
            reveal = course is not null && course.AuthorId == userId;
        }

        // Zugriff: Eigentümer, Kurs-Autor oder Admin.
        if (!isOwner && !reveal)
            return ServiceResult<CodeSubmissionResultDto>.Forbidden("Not your submission.");

        return ServiceResult<CodeSubmissionResultDto>.Ok(Mappers.ToCodeSubmissionDto(sub, reveal));
    }
}
