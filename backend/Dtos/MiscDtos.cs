using System.Text.Json.Serialization;

namespace DevEdu.Api.Dtos;

public record CreateEnrollmentRequest(string? CourseId);

public record EnrollmentDto(string Id, string CourseId, string Status, DateTime StartedAt);

public record ProgressDto(string CourseId, List<string> CompletedTopicIds, List<string> CompletedChapterIds);

public record ErrorResponse(
    string Error,
    [property: JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)] object? Details = null);
