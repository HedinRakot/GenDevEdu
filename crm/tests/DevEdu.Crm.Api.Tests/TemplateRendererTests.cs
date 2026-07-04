using DevEdu.Crm.Api.Services;
using Xunit;

namespace DevEdu.Crm.Api.Tests;

public class TemplateRendererTests
{
    private static readonly Dictionary<string, string> Values = new()
    {
        ["vorname"] = "Max",
        ["nachname"] = "Mustermann",
    };

    [Fact]
    public void Render_SubstitutesKnownPlaceholders()
    {
        var result = TemplateRenderer.Render("Hallo {{vorname}} {{nachname}}!", Values);

        Assert.Equal("Hallo Max Mustermann!", result.Text);
        Assert.Empty(result.Unresolved);
    }

    [Fact]
    public void Render_SubstitutesRepeatedPlaceholders()
    {
        var result = TemplateRenderer.Render("{{vorname}}, ja du, {{vorname}}!", Values);

        Assert.Equal("Max, ja du, Max!", result.Text);
    }

    [Fact]
    public void Render_ReportsUnknownPlaceholders_OnceEach_AndKeepsThemVisible()
    {
        var result = TemplateRenderer.Render("{{unbekannt}} und {{unbekannt}} und {{nochwas}}", Values);

        Assert.Equal("{{unbekannt}} und {{unbekannt}} und {{nochwas}}", result.Text);
        Assert.Equal(new[] { "unbekannt", "nochwas" }, result.Unresolved);
    }

    [Fact]
    public void Render_EmptyTemplate_ReturnsEmpty()
    {
        var result = TemplateRenderer.Render(string.Empty, Values);

        Assert.Equal(string.Empty, result.Text);
        Assert.Empty(result.Unresolved);
    }

    [Fact]
    public void Render_EmptyValue_SubstitutesEmptyString()
    {
        var result = TemplateRenderer.Render("[{{leer}}]", new Dictionary<string, string> { ["leer"] = "" });

        Assert.Equal("[]", result.Text);
        Assert.Empty(result.Unresolved);
    }
}
