using System.Globalization;
using System.Text;
using System.Text.RegularExpressions;

namespace DevEdu.Api.Services;

public static class Slug
{
    public static string From(string input)
    {
        if (string.IsNullOrWhiteSpace(input))
            return Guid.NewGuid().ToString("N")[..8];

        // Normalize accents/umlauts to ASCII-ish.
        var normalized = input.Trim().ToLowerInvariant()
            .Replace("ä", "ae").Replace("ö", "oe").Replace("ü", "ue").Replace("ß", "ss");

        var sb = new StringBuilder();
        foreach (var ch in normalized.Normalize(NormalizationForm.FormD))
        {
            var cat = CharUnicodeInfo.GetUnicodeCategory(ch);
            if (cat != UnicodeCategory.NonSpacingMark)
                sb.Append(ch);
        }

        var slug = sb.ToString().Normalize(NormalizationForm.FormC);
        slug = Regex.Replace(slug, @"[^a-z0-9]+", "-").Trim('-');
        return string.IsNullOrEmpty(slug) ? Guid.NewGuid().ToString("N")[..8] : slug;
    }
}
