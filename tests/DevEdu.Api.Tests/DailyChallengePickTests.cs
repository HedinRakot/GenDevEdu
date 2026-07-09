using DevEdu.Api.Models;
using DevEdu.Api.Services;
using Xunit;

namespace DevEdu.Api.Tests;

public class DailyChallengePickTests
{
    private static List<DailyChallenge> Pool(int count) =>
        Enumerable.Range(0, count)
            .Select(i => new DailyChallenge { Id = $"ch-{i:D2}" })
            .ToList();

    [Fact]
    public void Pick_SameDay_IsDeterministic()
    {
        var pool = Pool(7);
        var a = DailyChallengeService.Pick(pool, 20_000);
        var b = DailyChallengeService.Pick(pool, 20_000);
        Assert.Equal(a.Id, b.Id);
    }

    [Fact]
    public void Pick_WithinOneCycle_EveryChallengeExactlyOnce()
    {
        var pool = Pool(9);
        // Zyklusgrenzen liegen bei Vielfachen der Pool-Länge.
        var cycleStart = 9 * 1234;
        var picked = Enumerable.Range(cycleStart, pool.Count)
            .Select(day => DailyChallengeService.Pick(pool, day).Id)
            .ToList();
        Assert.Equal(pool.Count, picked.Distinct().Count());
    }

    [Fact]
    public void Pick_DifferentCycles_ShuffleDiffers()
    {
        var pool = Pool(12);
        string Sequence(int cycle) => string.Join(",",
            Enumerable.Range(cycle * pool.Count, pool.Count)
                .Select(day => DailyChallengeService.Pick(pool, day).Id));

        // Nicht jede Permutation muss verschieden sein, aber unter mehreren
        // Zyklen muss mindestens eine andere Reihenfolge auftreten.
        var sequences = Enumerable.Range(0, 5).Select(Sequence).Distinct().Count();
        Assert.True(sequences > 1, "Shuffle produced identical order for all cycles.");
    }
}
