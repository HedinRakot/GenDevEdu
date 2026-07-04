using System.Text.Json;
using DevEdu.Api.Dtos;
using DevEdu.Api.Models;
using DevEdu.Api.Services.Chat;

namespace DevEdu.Api.Endpoints;

public static class ChatEndpoints
{
    public static void MapChatEndpoints(this IEndpointRouteBuilder app)
    {
        // Streamt die Tutor-Antwort als Server-Sent-Events. Jede Zeile:
        //   data: {"delta":"..."}    (Text-Chunk)
        //   data: {"done":true}      (Abschluss)
        //   data: {"error":"..."}    (Fehler; ggf. nach bereits gesendeten Chunks)
        app.MapPost("/api/chat", async (ChatRequestDto dto, System.Security.Claims.ClaimsPrincipal user, HttpContext http, ChatService svc, CancellationToken ct) =>
        {
            var messages = (dto.Messages ?? new())
                .Where(m => !string.IsNullOrWhiteSpace(m.Content))
                .Select(m => new ChatMessage(m.Role == "assistant" ? "assistant" : "user", m.Content))
                .ToList();

            if (messages.Count == 0)
            {
                http.Response.StatusCode = StatusCodes.Status400BadRequest;
                await http.Response.WriteAsJsonAsync(new ErrorResponse("messages is required."), ct);
                return;
            }

            var context = dto.Context is null
                ? null
                : new ChatContext(dto.Context.CourseId, dto.Context.ChapterId, dto.Context.ContentId, dto.Context.QuestionId, dto.Context.SelectedAnswer);
            var request = new ChatRequest(messages, dto.Provider, context);

            http.Response.Headers.ContentType = "text/event-stream";
            http.Response.Headers.CacheControl = "no-cache";
            http.Response.Headers["X-Accel-Buffering"] = "no";   // Proxy-Buffering aus

            try
            {
                var prep = await svc.PrepareAsync(request, user.UserId(), ct);
                await foreach (var chunk in prep.Provider.StreamAsync(prep.SystemPrompt, request.Messages, ct))
                {
                    await WriteEvent(http, new { delta = chunk }, ct);
                }
                if (prep.Sources.Count > 0)
                    await WriteEvent(http, new
                    {
                        sources = prep.Sources.Select(s => new
                        {
                            title = s.Title, kind = s.Kind, chapterId = s.ChapterId, courseId = s.CourseId,
                        }),
                    }, ct);
                await WriteEvent(http, new { done = true }, ct);
            }
            catch (OperationCanceledException) when (ct.IsCancellationRequested)
            {
                // Client hat die Verbindung getrennt — nichts weiter zu tun.
            }
            catch (Exception)
            {
                await WriteEvent(http, new { error = "chat_failed" }, ct);
            }
        }).RequireAuthorization();

        // B4: RAG-Index (neu) bauen/aktualisieren — nur Admin.
        app.MapPost("/api/chat/reindex", async (CourseIndexer indexer, CancellationToken ct) =>
        {
            if (!indexer.IsAvailable)
                return Results.Json(new ErrorResponse("Kein Embedding-Key konfiguriert."),
                    statusCode: StatusCodes.Status503ServiceUnavailable);
            var result = await indexer.ReindexAllAsync(ct);
            return Results.Ok(result);
        }).RequireAuthorization(Policies.AdminOnly);
    }

    private static async Task WriteEvent(HttpContext http, object payload, CancellationToken ct)
    {
        await http.Response.WriteAsync("data: " + JsonSerializer.Serialize(payload) + "\n\n", ct);
        await http.Response.Body.FlushAsync(ct);
    }
}
