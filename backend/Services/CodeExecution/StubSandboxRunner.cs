using System.Diagnostics;
using DevEdu.Api.Models;

namespace DevEdu.Api.Services.CodeExecution;

/// <summary>
/// Dev-Ersatz für den <see cref="PodmanSandboxRunner"/>, wenn kein Podman-Socket
/// verfügbar ist (lokale macOS-Entwicklung). Führt <b>keinen</b> Code aus, sondern
/// meldet erfolgreiches Kompilieren und bestandene Testfälle, damit der End-to-End-Flow
/// (Submit → Polling → Attempt) lokal testbar ist. Aktivierung nur über
/// <c>Sandbox:UseStub=true</c> (siehe <see cref="SandboxOptions.UseStub"/>) —
/// niemals in Produktion registrieren.
/// </summary>
public class StubSandboxRunner : ISandboxRunner
{
    private readonly ILogger<StubSandboxRunner> _logger;

    public StubSandboxRunner(ILogger<StubSandboxRunner> logger)
    {
        _logger = logger;
        _logger.LogWarning(
            "StubSandboxRunner aktiv (Sandbox:UseStub=true) — Code wird NICHT ausgeführt, " +
            "alle Testfälle gelten als bestanden. Nur für lokale Entwicklung.");
    }

    public Task<SandboxRunResult> RunAsync(
        string code, CodeLanguage language, IReadOnlyList<CodeTestCase> testCases,
        SandboxLimits limits, CancellationToken ct)
    {
        var sw = Stopwatch.StartNew();
        var tests = testCases
            .Select(tc => new SandboxTestResult(
                TestCaseId: tc.Id,
                Passed: true,
                Outcome: CodeRunOutcome.Passed,
                DurationMs: 0,
                ActualOutput: tc.ExpectedOutput,
                Stderr: string.Empty))
            .ToList();
        sw.Stop();

        return Task.FromResult(new SandboxRunResult(
            Compiled: true,
            CompileError: null,
            Tests: tests,
            TotalDurationMs: sw.ElapsedMilliseconds));
    }
}
