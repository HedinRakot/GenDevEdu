using System.Text.RegularExpressions;

namespace DevEdu.Crm.Api.Services;

/// <summary>
/// Reine Platzhalter-Engine für E-Mail-Vorlagen. Syntax: {{platzhalter}}.
/// Unbekannte Platzhalter bleiben im Text sichtbar stehen und werden gemeldet,
/// damit die Vorschau davor warnen kann.
/// </summary>
public static class TemplateRenderer
{
    private static readonly Regex Placeholder = new(@"\{\{(\w+)\}\}", RegexOptions.Compiled);

    public record RenderResult(string Text, IReadOnlyList<string> Unresolved);

    public static RenderResult Render(string template, IReadOnlyDictionary<string, string> values)
    {
        var unresolved = new List<string>();
        var text = Placeholder.Replace(template, match =>
        {
            var name = match.Groups[1].Value;
            if (values.TryGetValue(name, out var value))
                return value;
            if (!unresolved.Contains(name))
                unresolved.Add(name);
            return match.Value;
        });
        return new RenderResult(text, unresolved);
    }
}
