using DevEdu.Api.Models;

namespace DevEdu.Api.Services.CodeExecution;

/// <summary>Pro-Run-Limits (entsprechen den podman-run-Flags).</summary>
public record SandboxLimits(int TimeLimitMs, int MemoryLimitMb, int CpuMillis = 500, int PidsLimit = 20);

public record SandboxTestResult(
    string TestCaseId,
    bool Passed,
    CodeRunOutcome Outcome,
    long DurationMs,
    string ActualOutput,
    string Stderr);

public record SandboxRunResult(
    bool Compiled,
    string? CompileError,
    IReadOnlyList<SandboxTestResult> Tests,
    long TotalDurationMs);

/// <summary>
/// Führt eingereichten Code isoliert gegen Testfälle aus. Naht für austauschbare
/// Mechaniken (rootless Podman-Sidecar jetzt; k8s-Jobs/gVisor als Prod-Pfad).
/// </summary>
public interface ISandboxRunner
{
    Task<SandboxRunResult> RunAsync(
        string code,
        CodeLanguage language,
        IReadOnlyList<CodeTestCase> testCases,
        SandboxLimits limits,
        CancellationToken ct);
}
