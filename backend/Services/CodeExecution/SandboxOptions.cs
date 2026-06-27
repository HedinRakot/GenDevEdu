namespace DevEdu.Api.Services.CodeExecution;

/// <summary>
/// Sandbox-Konfiguration, gebunden aus "Sandbox:*" / "Sandbox__*" (wie MongoOptions).
/// </summary>
public class SandboxOptions
{
    /// <summary>Docker-kompatibler Podman-Socket des Sidecars.</summary>
    public string PodmanSocketUri { get; set; } = "unix:///podman/podman.sock";

    /// <summary>Vorbereitetes Runner-Image (SDK + non-root User).</summary>
    public string RunnerImage { get; set; } = "localhost/devedu/csharp-runner:local";

    /// <summary>Geteiltes Scratch-Verzeichnis (in backend UND podman-Sidecar gleich gemountet).</summary>
    public string ScratchDir { get; set; } = "/sandbox";

    /// <summary>MVP: serielle Ausführung (deckelt zusammen mit dem Sidecar-Pod-Limit den RAM).</summary>
    public int MaxConcurrentRuns { get; set; } = 1;

    public int CodeSizeLimitBytes { get; set; } = 64 * 1024;
    public int OutputCapBytes { get; set; } = 64 * 1024;

    /// <summary>Zusätzliche Gnadenfrist auf das Per-Run-Zeitlimit, bevor der Container gekillt wird.</summary>
    public int TimeoutGraceMs { get; set; } = 2000;

    /// <summary>Zeitbudget für den einmaligen Compile-Schritt (separat vom Ausführungs-Timeout).</summary>
    public int CompileTimeoutMs { get; set; } = 60000;
}
