namespace DevEdu.Api.Dtos;

// ─── Chat (POST /api/chat, SSE) ──────────────────────────────────────────────

public record ChatMessageDto(string Role, string Content);

/// <summary>
/// Chat-Anfrage. <see cref="Provider"/> überschreibt optional den Default-Provider
/// ("gemini"/"claude"). <see cref="Context"/> wird ab B3 genutzt (Kurskontext/RAG).
/// </summary>
public record ChatRequestDto(
    List<ChatMessageDto>? Messages,
    string? Provider = null,
    ChatContextDto? Context = null);

public record ChatContextDto(
    string? CourseId = null,
    string? ChapterId = null,
    string? ContentId = null,
    string? QuestionId = null,
    string? SelectedAnswer = null);
