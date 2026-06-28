using DevEdu.Api.Models;

namespace DevEdu.Api.Services;

/// <summary>
/// Reine Katalog-Filterung (kein DB-Zugriff ⇒ unit-testbar). Wird von
/// <see cref="CourseService.ListAsync"/> nach dem Rollen-/Published-Filter angewandt.
/// </summary>
public static class CourseCatalog
{
    public static List<Course> Filter(
        IEnumerable<Course> courses, string? search,
        IReadOnlyCollection<string>? tags, string? level)
    {
        var q = courses;

        if (!string.IsNullOrWhiteSpace(level))
            q = q.Where(c => string.Equals(c.Level, level, StringComparison.OrdinalIgnoreCase));

        if (tags is { Count: > 0 })
            q = q.Where(c => c.Tags.Any(t => tags.Contains(t, StringComparer.OrdinalIgnoreCase)));

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim();
            q = q.Where(c =>
                c.Name.Contains(s, StringComparison.OrdinalIgnoreCase)
                || Mappers.PrimaryText(c.Titel).Contains(s, StringComparison.OrdinalIgnoreCase)
                || c.Tags.Any(t => t.Contains(s, StringComparison.OrdinalIgnoreCase)));
        }

        return q.ToList();
    }
}
