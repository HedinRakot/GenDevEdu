using DevEdu.Api.Dtos;
using DevEdu.Api.Models;
using MongoDB.Driver;
using TimeZoneConverter;

namespace DevEdu.Api.Services;

/// <summary>
/// Server-verwaltete Daily Challenges: deterministische Tagesauswahl über alle
/// aktiven Challenges (alle Nutzer sehen am selben Tag dieselbe) plus
/// Verwaltungs-CRUD für Autoren/Admins.
/// </summary>
public class DailyChallengeService
{
    private static readonly string[] Difficulties = { "easy", "medium", "hard" };

    private readonly MongoContext _db;

    public DailyChallengeService(MongoContext db) => _db = db;

    // ─── Lerner ───────────────────────────────────────────────────────────────

    /// <summary>Die Challenge des (Europe/Berlin-)Kalendertags, null bei leerem Pool.</summary>
    public async Task<DailyChallengeDto?> GetTodayAsync(DateTime? utcNow = null)
    {
        var pool = await _db.DailyChallenges
            .Find(c => c.Active)
            .SortBy(c => c.Id) // stabile Pool-Reihenfolge, unabhängig von Insert-Reihenfolge
            .ToListAsync();
        if (pool.Count == 0) return null;

        var tz = TZConvert.GetTimeZoneInfo("Europe/Berlin");
        var today = DateOnly.FromDateTime(
            TimeZoneInfo.ConvertTimeFromUtc(utcNow ?? DateTime.UtcNow, tz));

        return ToDto(Pick(pool, today.DayNumber));
    }

    /// <summary>
    /// Wählt deterministisch: pro "Zyklus" (Pool-Länge in Tagen) erscheint jede
    /// Challenge genau einmal, die Reihenfolge wird pro Zyklus neu gemischt
    /// (seed-basiertes Fisher-Yates — analog zur früheren Frontend-Logik).
    /// </summary>
    public static DailyChallenge Pick(IReadOnlyList<DailyChallenge> pool, int dayNumber)
    {
        var n = pool.Count;
        var cycle = dayNumber / n;
        var pos = ((dayNumber % n) + n) % n;
        var order = ShuffledIndices(n, (uint)cycle);
        return pool[order[pos]];
    }

    /// <summary>Fisher-Yates-Permutation von [0..count-1] mit deterministischem PRNG (mulberry32).</summary>
    private static int[] ShuffledIndices(int count, uint seed)
    {
        var arr = Enumerable.Range(0, count).ToArray();
        var state = seed;
        double Next()
        {
            state = unchecked(state + 0x6D2B79F5u);
            var x = state;
            x = unchecked((x ^ (x >> 15)) * (x | 1u));
            x ^= unchecked(x + (x ^ (x >> 7)) * (x | 61u));
            return (x ^ (x >> 14)) / 4294967296.0;
        }
        for (var i = count - 1; i > 0; i--)
        {
            var j = (int)(Next() * (i + 1));
            (arr[i], arr[j]) = (arr[j], arr[i]);
        }
        return arr;
    }

    // ─── Verwaltung (Author/Admin) ────────────────────────────────────────────

    public async Task<List<DailyChallengeDto>> ListAsync()
    {
        var all = await _db.DailyChallenges
            .Find(FilterDefinition<DailyChallenge>.Empty)
            .SortBy(c => c.Category).ThenBy(c => c.Id)
            .ToListAsync();
        return all.Select(ToDto).ToList();
    }

    public async Task<ServiceResult<DailyChallengeDto>> CreateAsync(SaveDailyChallengeRequest req)
    {
        var error = Validate(req);
        if (error is not null)
            return ServiceResult<DailyChallengeDto>.Validation(error);

        var challenge = new DailyChallenge
        {
            Id = string.IsNullOrWhiteSpace(req.Id) ? Guid.NewGuid().ToString("N") : req.Id.Trim(),
        };
        Apply(challenge, req);

        var exists = await _db.DailyChallenges.Find(c => c.Id == challenge.Id).AnyAsync();
        if (exists)
            return ServiceResult<DailyChallengeDto>.Validation($"Challenge '{challenge.Id}' already exists.");

        await _db.DailyChallenges.InsertOneAsync(challenge);
        return ServiceResult<DailyChallengeDto>.Ok(ToDto(challenge));
    }

    public async Task<ServiceResult<DailyChallengeDto>> UpdateAsync(string id, SaveDailyChallengeRequest req)
    {
        var error = Validate(req);
        if (error is not null)
            return ServiceResult<DailyChallengeDto>.Validation(error);

        var challenge = await _db.DailyChallenges.Find(c => c.Id == id).FirstOrDefaultAsync();
        if (challenge is null)
            return ServiceResult<DailyChallengeDto>.NotFound("Challenge not found.");

        Apply(challenge, req);
        challenge.UpdatedAt = DateTime.UtcNow;
        await _db.DailyChallenges.ReplaceOneAsync(c => c.Id == id, challenge);
        return ServiceResult<DailyChallengeDto>.Ok(ToDto(challenge));
    }

    public async Task<ServiceResult<bool>> DeleteAsync(string id)
    {
        var result = await _db.DailyChallenges.DeleteOneAsync(c => c.Id == id);
        return result.DeletedCount == 0
            ? ServiceResult<bool>.NotFound("Challenge not found.")
            : ServiceResult<bool>.Ok(true);
    }

    private static string? Validate(SaveDailyChallengeRequest req)
    {
        if (req.TitleItems is null || req.TitleItems.All(i => string.IsNullOrWhiteSpace(i.Text)))
            return "title is required.";
        if (req.DescriptionItems is null || req.DescriptionItems.All(i => string.IsNullOrWhiteSpace(i.Text)))
            return "description is required.";
        if (!Difficulties.Contains(req.Difficulty))
            return "difficulty must be easy, medium or hard.";
        if (req.EstimatedMinutes is < 1 or > 120)
            return "estimatedMinutes must be between 1 and 120.";
        return null;
    }

    private static void Apply(DailyChallenge challenge, SaveDailyChallengeRequest req)
    {
        challenge.Title = Mappers.BuildTexte(req.TitleItems, string.Empty);
        challenge.Description = Mappers.BuildTexte(req.DescriptionItems, string.Empty);
        challenge.ExampleSnippet = string.IsNullOrWhiteSpace(req.ExampleSnippet) ? null : req.ExampleSnippet;
        challenge.SnippetLang = string.IsNullOrWhiteSpace(req.SnippetLang) ? "csharp" : req.SnippetLang.Trim();
        challenge.EstimatedMinutes = req.EstimatedMinutes;
        challenge.Difficulty = req.Difficulty;
        challenge.Category = string.IsNullOrWhiteSpace(req.Category) ? "general" : req.Category.Trim();
        challenge.Active = req.Active;
    }

    private static DailyChallengeDto ToDto(DailyChallenge c) => new(
        c.Id, c.Title, c.Description, c.ExampleSnippet, c.SnippetLang,
        c.EstimatedMinutes, c.Difficulty, c.Category, c.Active);
}
