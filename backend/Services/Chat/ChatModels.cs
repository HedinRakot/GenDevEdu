namespace DevEdu.Api.Services.Chat;

/// <summary>Eine Chat-Nachricht. Role ist "user" oder "assistant".</summary>
public record ChatMessage(string Role, string Content);

/// <summary>
/// Ein Chat-Request an den Service. <see cref="Provider"/> überschreibt optional den
/// konfigurierten Default-Provider. <see cref="Context"/> ist ab B3 gesetzt
/// (kurs-bewusster Tutor / RAG) und bleibt in B1 leer.
/// </summary>
public record ChatRequest(
    IReadOnlyList<ChatMessage> Messages,
    string? Provider = null,
    ChatContext? Context = null);

/// <summary>
/// Optionaler Kontext, den der Service in den System-Prompt injiziert.
/// Platzhalter für B3 (aktuelle Lektion/Frage) und B5 (RAG-Passagen).
/// </summary>
public record ChatContext(
    string? CourseId = null,
    string? ChapterId = null,
    string? ContentId = null,
    string? QuestionId = null,
    /// <summary>B7: vom Lerner gewählte Antwort (löst die Quiz-Erklärung aus).</summary>
    string? SelectedAnswer = null);
