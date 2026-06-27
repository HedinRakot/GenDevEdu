using System.Diagnostics;
using System.Text;
using Docker.DotNet;
using Docker.DotNet.Models;
using DevEdu.Api.Models;

namespace DevEdu.Api.Services.CodeExecution;

/// <summary>
/// Führt C#-Einreichungen in kurzlebigen, harten Containern aus – über den
/// Docker-kompatiblen Socket des rootless Podman-Sidecars. Entspricht
/// `podman run --network none --memory … --cpus … --pids-limit … --read-only
/// --user 1000 --cap-drop ALL --security-opt no-new-privileges`.
/// </summary>
public class PodmanSandboxRunner : ISandboxRunner, IDisposable
{
    private readonly SandboxOptions _options;
    private readonly ILogger<PodmanSandboxRunner> _logger;
    private readonly DockerClient _client;

    public PodmanSandboxRunner(SandboxOptions options, ILogger<PodmanSandboxRunner> logger)
    {
        _options = options;
        _logger = logger;
        _client = new DockerClientConfiguration(new Uri(options.PodmanSocketUri)).CreateClient();
    }

    public async Task<SandboxRunResult> RunAsync(
        string code, CodeLanguage language, IReadOnlyList<CodeTestCase> testCases,
        SandboxLimits limits, CancellationToken ct)
    {
        if (language != CodeLanguage.CSharp)
            throw new NotSupportedException($"Language {language} not supported (MVP: C# only).");

        var sw = Stopwatch.StartNew();
        var runId = Guid.NewGuid().ToString("N");
        var scratch = Path.Combine(_options.ScratchDir, runId);
        Directory.CreateDirectory(scratch);

        try
        {
            var programPath = Path.Combine(scratch, "Program.cs");
            var csprojPath = Path.Combine(scratch, "proj.csproj");
            await File.WriteAllTextAsync(programPath, code, ct);
            await File.WriteAllTextAsync(csprojPath, CsProj, ct);

            // Der Container läuft als uid 1000 (ggf. via rootless-userns gemappt) und
            // muss in /work obj/out schreiben sowie die Quellen lesen können.
            MakeWorldWritable(scratch);
            MakeWorldReadable(programPath);
            MakeWorldReadable(csprojPath);

            // ── 1× kompilieren (in /work schreibbar) ──────────────────────────
            var compile = await RunContainerAsync(
                cmd: new[] { "bash", "-lc", "cd /work && dotnet build proj.csproj -c Release -o /work/out --nologo -v q" },
                binds: new[] { $"{scratch}:/work:rw" },
                limits: limits,
                timeoutMs: _options.CompileTimeoutMs,
                tmpfsSize: "256m",
                stdin: null,
                ct: ct);

            if (compile.TimedOut || compile.ExitCode != 0)
            {
                var msg = compile.TimedOut
                    ? "Compilation timed out."
                    : Join(compile.Stdout, compile.Stderr);
                sw.Stop();
                return new SandboxRunResult(false, msg, Array.Empty<SandboxTestResult>(), sw.ElapsedMilliseconds);
            }

            // ── je Testfall ausführen (/work read-only) ───────────────────────
            var results = new List<SandboxTestResult>(testCases.Count);
            foreach (var tc in testCases)
            {
                var run = await RunContainerAsync(
                    cmd: new[] { "dotnet", "/work/out/proj.dll" },
                    binds: new[] { $"{scratch}:/work:ro" },
                    limits: limits,
                    timeoutMs: limits.TimeLimitMs + _options.TimeoutGraceMs,
                    tmpfsSize: "64m",
                    stdin: tc.Input,
                    ct: ct);

                var (passed, outcome) = Evaluate(run, tc.ExpectedOutput);
                results.Add(new SandboxTestResult(tc.Id, passed, outcome, run.DurationMs, run.Stdout, run.Stderr));
            }

            sw.Stop();
            return new SandboxRunResult(true, null, results, sw.ElapsedMilliseconds);
        }
        finally
        {
            // Build-Artefakte (obj/out) gehören dem gemappten Container-Subuid und
            // sind vom Backend-Prozess nicht löschbar (rootless userns). Daher zuerst
            // ein Wegwerf-Container als derselbe User aufräumen (/work ist 0777 →
            // darf auch die Backend-Dateien entlinken), dann das leere Verzeichnis.
            await TryContainerCleanupAsync(scratch, limits);
            TryDeleteScratch(scratch);
        }
    }

    private static (bool passed, CodeRunOutcome outcome) Evaluate(ContainerRunResult run, string expected)
    {
        if (run.TimedOut) return (false, CodeRunOutcome.TimeLimit);
        if (run.OomKilled) return (false, CodeRunOutcome.MemoryLimit);
        if (run.ExitCode != 0) return (false, CodeRunOutcome.RuntimeError);
        bool ok = Normalize(run.Stdout) == Normalize(expected);
        return (ok, ok ? CodeRunOutcome.Passed : CodeRunOutcome.Failed);
    }

    // ─── Container-Ausführung ────────────────────────────────────────────────

    private async Task<ContainerRunResult> RunContainerAsync(
        IList<string> cmd, IList<string> binds, SandboxLimits limits,
        int timeoutMs, string tmpfsSize, string? stdin, CancellationToken ct)
    {
        var sw = Stopwatch.StartNew();
        long memBytes = (long)limits.MemoryLimitMb * 1024 * 1024;

        var create = await _client.Containers.CreateContainerAsync(new CreateContainerParameters
        {
            Image = _options.RunnerImage,
            Cmd = cmd,
            WorkingDir = "/work",
            User = "1000:1000",
            Env = new[] { "HOME=/tmp", "DOTNET_CLI_HOME=/tmp", "DOTNET_NOLOGO=1", "DOTNET_SKIP_FIRST_TIME_EXPERIENCE=1" },
            Tty = false,
            AttachStdin = stdin is not null,
            OpenStdin = stdin is not null,
            StdinOnce = stdin is not null,
            AttachStdout = true,
            AttachStderr = true,
            HostConfig = new HostConfig
            {
                NetworkMode = "none",
                Memory = memBytes,
                MemorySwap = memBytes,                 // = Memory ⇒ kein Swap
                NanoCPUs = (long)(limits.CpuMillis / 1000.0 * 1_000_000_000),
                PidsLimit = limits.PidsLimit,
                ReadonlyRootfs = true,
                Tmpfs = new Dictionary<string, string> { ["/tmp"] = $"rw,size={tmpfsSize}" },
                Binds = binds,
                CapDrop = new[] { "ALL" },
                SecurityOpt = new[] { "no-new-privileges" },
                AutoRemove = false,
            },
        }, ct);

        var id = create.ID;
        bool timedOut = false;
        string stdout = string.Empty, stderr = string.Empty;

        using var timeoutCts = CancellationTokenSource.CreateLinkedTokenSource(ct);
        timeoutCts.CancelAfter(timeoutMs);

        try
        {
            using var stream = await _client.Containers.AttachContainerAsync(id, tty: false,
                new ContainerAttachParameters { Stream = true, Stdin = stdin is not null, Stdout = true, Stderr = true }, ct);

            await _client.Containers.StartContainerAsync(id, new ContainerStartParameters(), ct);

            if (stdin is not null)
            {
                var bytes = Encoding.UTF8.GetBytes(stdin);
                await stream.WriteAsync(bytes, 0, bytes.Length, ct);
                stream.CloseWrite();
            }

            try
            {
                (stdout, stderr) = await stream.ReadOutputToEndAsync(timeoutCts.Token);
            }
            catch (OperationCanceledException) when (timeoutCts.IsCancellationRequested && !ct.IsCancellationRequested)
            {
                timedOut = true;
                await SafeKillAsync(id);
            }

            long exitCode = -1;
            bool oom = false;
            try
            {
                var inspect = await _client.Containers.InspectContainerAsync(id, ct);
                exitCode = inspect.State.ExitCode;
                oom = inspect.State.OOMKilled;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Inspect failed for container {Id}.", id);
            }

            sw.Stop();
            return new ContainerRunResult(exitCode, stdout, stderr, oom, timedOut, sw.ElapsedMilliseconds);
        }
        finally
        {
            await SafeRemoveAsync(id);
        }
    }

    private async Task SafeKillAsync(string id)
    {
        try { await _client.Containers.KillContainerAsync(id, new ContainerKillParameters()); }
        catch (Exception ex) { _logger.LogWarning(ex, "Kill failed for container {Id}.", id); }
    }

    private async Task SafeRemoveAsync(string id)
    {
        try { await _client.Containers.RemoveContainerAsync(id, new ContainerRemoveParameters { Force = true }); }
        catch (Exception ex) { _logger.LogWarning(ex, "Remove failed for container {Id}.", id); }
    }

    /// <summary>
    /// Leert das Scratch-Verzeichnis von innen über einen Container (gleicher User
    /// wie Compile/Run ⇒ Eigentümer der obj/out-Artefakte). Best-effort.
    /// </summary>
    private async Task TryContainerCleanupAsync(string scratch, SandboxLimits limits)
    {
        try
        {
            await RunContainerAsync(
                cmd: new[] { "bash", "-lc", "rm -rf /work/* /work/.[!.]* 2>/dev/null || true; true" },
                binds: new[] { $"{scratch}:/work:rw" },
                limits: limits,
                timeoutMs: 15000,
                tmpfsSize: "16m",
                stdin: null,
                ct: CancellationToken.None);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Container cleanup failed for {Scratch}.", scratch);
        }
    }

    private void TryDeleteScratch(string path)
    {
        try { if (Directory.Exists(path)) Directory.Delete(path, recursive: true); }
        catch (Exception ex) { _logger.LogWarning(ex, "Scratch cleanup failed for {Path}.", path); }
    }

    private static void MakeWorldWritable(string dir)
    {
        if (!OperatingSystem.IsLinux()) return;
        try
        {
            File.SetUnixFileMode(dir,
                UnixFileMode.UserRead | UnixFileMode.UserWrite | UnixFileMode.UserExecute |
                UnixFileMode.GroupRead | UnixFileMode.GroupWrite | UnixFileMode.GroupExecute |
                UnixFileMode.OtherRead | UnixFileMode.OtherWrite | UnixFileMode.OtherExecute);
        }
        catch { /* best effort */ }
    }

    private static void MakeWorldReadable(string file)
    {
        if (!OperatingSystem.IsLinux()) return;
        try
        {
            File.SetUnixFileMode(file,
                UnixFileMode.UserRead | UnixFileMode.UserWrite |
                UnixFileMode.GroupRead | UnixFileMode.OtherRead);
        }
        catch { /* best effort */ }
    }

    /// <summary>Trailing-Whitespace je Zeile + trailing Leerzeilen normalisieren.</summary>
    private static string Normalize(string s)
    {
        var lines = s.Replace("\r\n", "\n").Split('\n').Select(l => l.TrimEnd()).ToList();
        while (lines.Count > 0 && lines[^1].Length == 0) lines.RemoveAt(lines.Count - 1);
        return string.Join("\n", lines);
    }

    private static string Join(string a, string b) =>
        string.Join("\n", new[] { a, b }.Where(x => !string.IsNullOrWhiteSpace(x)));

    public void Dispose() => _client.Dispose();

    private const string CsProj =
        """
        <Project Sdk="Microsoft.NET.Sdk">
          <PropertyGroup>
            <OutputType>Exe</OutputType>
            <TargetFramework>net10.0</TargetFramework>
            <Nullable>enable</Nullable>
            <ImplicitUsings>enable</ImplicitUsings>
            <AssemblyName>proj</AssemblyName>
          </PropertyGroup>
        </Project>
        """;

    private record ContainerRunResult(
        long ExitCode, string Stdout, string Stderr, bool OomKilled, bool TimedOut, long DurationMs);
}
