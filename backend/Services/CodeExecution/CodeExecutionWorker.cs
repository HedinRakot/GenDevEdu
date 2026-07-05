using System.Diagnostics;
using DevEdu.Api.Models;
using MongoDB.Driver;

namespace DevEdu.Api.Services.CodeExecution;

/// <summary>
/// Verarbeitet eingereihte Code-Submissions seriell: lädt die Submission, führt sie
/// über den <see cref="ISandboxRunner"/> aus, schreibt Ergebnis + Attempt (F6) zurück.
/// </summary>
public class CodeExecutionWorker : BackgroundService
{
    private readonly ICodeSubmissionQueue _queue;
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ISandboxRunner _runner;
    private readonly SandboxOptions _options;
    private readonly ILogger<CodeExecutionWorker> _logger;

    public CodeExecutionWorker(
        ICodeSubmissionQueue queue,
        IServiceScopeFactory scopeFactory,
        ISandboxRunner runner,
        SandboxOptions options,
        ILogger<CodeExecutionWorker> logger)
    {
        _queue = queue;
        _scopeFactory = scopeFactory;
        _runner = runner;
        _options = options;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        await foreach (var id in _queue.DequeueAllAsync(stoppingToken))
        {
            try
            {
                await ProcessOneAsync(id, stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                // Ein Fehler bei einer Submission darf die Schleife nie beenden.
                _logger.LogError(ex, "Code submission {Id} failed unexpectedly.", id);
                await TryMarkErrorAsync(id);
            }
        }
    }

    private async Task ProcessOneAsync(string submissionId, CancellationToken ct)
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<MongoContext>();

        var sub = await db.CodeSubmissions.Find(x => x.Id == submissionId).FirstOrDefaultAsync(ct);
        if (sub is null)
        {
            _logger.LogWarning("Code submission {Id} not found; skipping.", submissionId);
            return;
        }

        var ql = await db.QuestionLists
            .Find(x => x.Questions.Any(q => q.Id == sub.QuestionId))
            .FirstOrDefaultAsync(ct);
        var question = ql?.Questions.FirstOrDefault(q => q.Id == sub.QuestionId);
        if (question?.Code is null)
        {
            sub.Status = CodeSubmissionStatus.Error;
            sub.Outcome = CodeRunOutcome.InternalError;
            sub.ErrorMessage = "Question or code task no longer exists.";
            sub.CompletedAt = DateTime.UtcNow;
            await db.CodeSubmissions.ReplaceOneAsync(x => x.Id == sub.Id, sub, cancellationToken: ct);
            return;
        }

        sub.Status = CodeSubmissionStatus.Running;
        sub.StartedAt = DateTime.UtcNow;
        await db.CodeSubmissions.ReplaceOneAsync(x => x.Id == sub.Id, sub, cancellationToken: ct);

        var code = question.Code;
        var limits = new SandboxLimits(code.TimeLimitMs, code.MemoryLimitMb);

        var sw = Stopwatch.StartNew();
        try
        {
            var result = await _runner.RunAsync(sub.SubmittedCode, code.Language, code.TestCases, limits, ct);
            sw.Stop();
            MapResult(sub, code, result, sw.ElapsedMilliseconds);
            sub.Status = CodeSubmissionStatus.Completed;
        }
        catch (Exception ex)
        {
            sw.Stop();
            _logger.LogError(ex, "Sandbox run failed for submission {Id}.", sub.Id);
            sub.Status = CodeSubmissionStatus.Error;
            sub.Outcome = CodeRunOutcome.InternalError;
            sub.ErrorMessage = "Execution failed.";
            sub.DurationMs = sw.ElapsedMilliseconds;
        }

        sub.CompletedAt = DateTime.UtcNow;

        // F6: bestandene Code-Aufgabe zählt wie eine gelöste Quizfrage.
        // Attempt VOR dem finalen Statuswechsel schreiben: Sobald "Completed"
        // sichtbar ist, existiert auch der Attempt (Leser verlassen sich darauf).
        if (sub.Status == CodeSubmissionStatus.Completed)
        {
            await db.Attempts.InsertOneAsync(new Attempt
            {
                UserId = sub.UserId,
                QuestionId = sub.QuestionId,
                CourseId = sub.CourseId,
                IsCorrect = sub.TotalCount > 0 && sub.PassedCount == sub.TotalCount,
                Score = sub.PassedCount,
            }, cancellationToken: ct);
        }

        await db.CodeSubmissions.ReplaceOneAsync(x => x.Id == sub.Id, sub, cancellationToken: ct);
    }

    private void MapResult(CodeSubmission sub, CodeQuestion code, SandboxRunResult result, long durationMs)
    {
        sub.DurationMs = durationMs;

        if (!result.Compiled)
        {
            sub.Outcome = CodeRunOutcome.CompileError;
            sub.CompileError = Truncate(result.CompileError, _options.OutputCapBytes);
            sub.PassedCount = 0;
            sub.TestResults = new();
            return;
        }

        var byId = result.Tests.ToDictionary(t => t.TestCaseId);
        sub.TestResults = code.TestCases.Select(tc =>
        {
            byId.TryGetValue(tc.Id, out var r);
            return new CodeTestCaseResult
            {
                TestCaseId = tc.Id,
                Hidden = tc.Hidden,
                Passed = r?.Passed ?? false,
                Outcome = r?.Outcome ?? CodeRunOutcome.InternalError,
                DurationMs = r?.DurationMs ?? 0,
                Input = tc.Input,
                ExpectedOutput = tc.ExpectedOutput,
                ActualOutput = Truncate(r?.ActualOutput, _options.OutputCapBytes),
                Stderr = Truncate(r?.Stderr, _options.OutputCapBytes),
            };
        }).ToList();

        sub.PassedCount = sub.TestResults.Count(r => r.Passed);
        sub.Outcome = sub.PassedCount == sub.TotalCount ? CodeRunOutcome.Passed : CodeRunOutcome.Failed;
    }

    private async Task TryMarkErrorAsync(string submissionId)
    {
        try
        {
            using var scope = _scopeFactory.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<MongoContext>();
            var update = Builders<CodeSubmission>.Update
                .Set(x => x.Status, CodeSubmissionStatus.Error)
                .Set(x => x.Outcome, CodeRunOutcome.InternalError)
                .Set(x => x.ErrorMessage, "Execution failed.")
                .Set(x => x.CompletedAt, DateTime.UtcNow);
            await db.CodeSubmissions.UpdateOneAsync(x => x.Id == submissionId, update);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Could not mark submission {Id} as Error.", submissionId);
        }
    }

    private static string? Truncate(string? value, int maxBytes)
    {
        if (string.IsNullOrEmpty(value)) return value;
        if (value.Length <= maxBytes) return value;
        return value[..maxBytes] + "\n…(gekürzt)";
    }
}
