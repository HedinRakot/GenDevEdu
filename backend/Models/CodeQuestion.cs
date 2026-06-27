namespace DevEdu.Api.Models;

/// <summary>Unterstützte Sandbox-Sprachen. MVP: nur C#; das Enum lässt Erweiterung zu.</summary>
public enum CodeLanguage { CSharp = 0 }

/// <summary>
/// Code-Aufgabe (eingebettet in <see cref="Question"/> bei QuestionType == Code).
/// <see cref="SolutionCode"/> ist autor-intern und wird Lernern nie ausgeliefert
/// (siehe Mappers-Reveal-Logik).
/// </summary>
public class CodeQuestion
{
    public CodeLanguage Language { get; set; } = CodeLanguage.CSharp;
    public string StarterCode { get; set; } = string.Empty;

    /// <summary>AUTOR-ONLY – nie an Lerner ausliefern.</summary>
    public string SolutionCode { get; set; } = string.Empty;

    public List<CodeTestCase> TestCases { get; set; } = new();
    public int TimeLimitMs { get; set; } = 5000;
    public int MemoryLimitMb { get; set; } = 256;
}

public class CodeTestCase
{
    public string Id { get; set; } = Guid.NewGuid().ToString("N");

    /// <summary>Wird dem Programm auf stdin gegeben.</summary>
    public string Input { get; set; } = string.Empty;

    /// <summary>Erwartete stdout-Ausgabe.</summary>
    public string ExpectedOutput { get; set; } = string.Empty;

    /// <summary>Versteckt: Lerner sieht nur bestanden/fehlgeschlagen, nicht Input/Expected.</summary>
    public bool Hidden { get; set; }
}
