using DevEdu.Api.Models;
using DevEdu.Api.Services;
using Xunit;

namespace DevEdu.Api.Tests;

public class CourseCatalogTests
{
    private static Course C(string name, string titelDe, string level, params string[] tags) => new()
    {
        Id = name,
        Name = name,
        Titel = new Texte { Items = { new TextItem { Text = titelDe, Language = 1 } } },
        Level = level,
        Tags = tags.ToList(),
    };

    private static List<Course> Sample() => new()
    {
        C("csharp-basics", "C# Grundlagen", CourseLevel.Beginner, "csharp", "grundlagen"),
        C("ts-advanced", "TypeScript Fortgeschritten", CourseLevel.Advanced, "typescript", "web"),
        C("algo", "Algorithmen", CourseLevel.Intermediate, "csharp", "algorithmen"),
    };

    [Fact]
    public void EmptyParams_ReturnAll()
    {
        var r = CourseCatalog.Filter(Sample(), null, null, null);
        Assert.Equal(3, r.Count);
    }

    [Fact]
    public void Level_ExactMatch_CaseInsensitive()
    {
        var r = CourseCatalog.Filter(Sample(), null, null, "beginner");
        Assert.Single(r);
        Assert.Equal("csharp-basics", r[0].Name);
    }

    [Fact]
    public void Tags_MatchAny()
    {
        var r = CourseCatalog.Filter(Sample(), null, new[] { "csharp" }, null);
        Assert.Equal(2, r.Count);   // csharp-basics + algo
        Assert.All(r, c => Assert.Contains("csharp", c.Tags));
    }

    [Fact]
    public void Search_MatchesNameTitleOrTag()
    {
        Assert.Single(CourseCatalog.Filter(Sample(), "grundlagen", null, null));        // Titel + Tag
        Assert.Single(CourseCatalog.Filter(Sample(), "ALGORITH", null, null));          // Name/Titel, case-insensitiv
        Assert.Single(CourseCatalog.Filter(Sample(), "typescript", null, null));        // Tag
        Assert.Empty(CourseCatalog.Filter(Sample(), "python", null, null));
    }

    [Fact]
    public void CombinedFilters_AreAnded()
    {
        // Level Intermediate UND Tag csharp ⇒ nur "algo"
        var r = CourseCatalog.Filter(Sample(), null, new[] { "csharp" }, CourseLevel.Intermediate);
        Assert.Single(r);
        Assert.Equal("algo", r[0].Name);
    }
}
