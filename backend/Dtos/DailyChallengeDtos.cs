using DevEdu.Api.Models;

namespace DevEdu.Api.Dtos;

// ─── Lerner (GET /api/daily-challenges/today) ────────────────────────────────

public record DailyChallengeDto(
    string Id,
    Texte Title,
    Texte Description,
    string? ExampleSnippet,
    string SnippetLang,
    int EstimatedMinutes,
    string Difficulty,
    string Category,
    bool Active);

// ─── Verwaltung (POST/PUT /api/admin/daily-challenges) ───────────────────────

public record SaveDailyChallengeRequest(
    string? Id,
    List<TextItemDto>? TitleItems,
    List<TextItemDto>? DescriptionItems,
    string? ExampleSnippet,
    string? SnippetLang,
    int EstimatedMinutes = 5,
    string Difficulty = "easy",
    string Category = "general",
    bool Active = true);
