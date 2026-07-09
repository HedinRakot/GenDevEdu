using DevEdu.Api.Models;

namespace DevEdu.Api.Dtos;

// ─── Hilftypen ────────────────────────────────────────────────────────────────

public record TextItemDto(string Text, int Language);

// ─── Kursliste (GET /api/courses) ────────────────────────────────────────────

public record CourseDto(string ElementId, string Name, Texte Titel, string Status, List<string> Tags, string Level);

// ─── Kapitel-Liste (GET /api/courses/{id}/chapters) ──────────────────────────

public record ChapterListModel(
    string CourseId,
    string CourseName,
    List<ChapterResponseDto> Chapters);

public record ChapterResponseDto(
    string ElementId,
    string Name,
    string CourseId,
    Texte Titel,
    int SortOrder,
    bool Show,
    int Rank,
    bool Completed,
    List<object> Questions,
    List<object> ChapterContent,
    bool HasQuiz = false,
    int PassThresholdPercent = 0,
    int MaxAttempts = 0,
    bool QuizPassed = false);

// ─── Kapitelinhalte (GET /api/chapters/{id}/content) ─────────────────────────

public record ChapterContentListModel(
    string CourseId,
    string ChapterId,
    string ChapterName,
    List<ChapterContentDto> ChapterContent);

public record ChapterContentDto(
    string ElementId,
    string Name,
    string CourseId,
    string ChapterId,
    Texte Titel,
    int ContentType,
    string LessonText,
    Texte LessonTexte,
    string VideoUrl,
    string QuestionListId,
    int SortOrder,
    List<object> QuestionLists,
    double AverageRank,
    int MaxRank,
    bool Completed);

// ─── Requests (Author) ───────────────────────────────────────────────────────

public record CreateCourseRequest(string? Name, List<TextItemDto>? TitelItems, List<string>? Tags = null, string? Level = null);

public record CreateChapterRequest(
    string? Name,
    List<TextItemDto>? TitelItems,
    int SortOrder = 0,
    bool Show = true);

public record CreateChapterContentRequest(
    string? Name,
    List<TextItemDto>? TitelItems,
    int ContentType = 0,
    string? LessonText = null,
    List<TextItemDto>? LessonTexteItems = null,
    string? VideoUrl = null,
    int SortOrder = 0);

/// <summary>
/// Neue Reihenfolge als vollständige, geordnete Liste der Element-IDs
/// (PUT /api/courses/{id}/chapters/order bzw. /api/chapters/{id}/contents/order).
/// </summary>
public record ReorderRequest(List<string>? OrderedIds);
