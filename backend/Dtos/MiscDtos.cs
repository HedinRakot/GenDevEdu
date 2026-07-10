using System.Text.Json.Serialization;

namespace DevEdu.Api.Dtos;

public record CreateEnrollmentRequest(string? CourseId);

public record EnrollmentDto(string Id, string CourseId, string Status, DateTime StartedAt);

public record ChapterQuizSummaryDto(
    string ChapterId,
    int EarnedPoints,
    int TotalPoints,
    int PassingThresholdPct,
    bool Passed);

public record ProgressDto(
    string CourseId,
    List<string> CompletedTopicIds,
    List<string> CompletedChapterIds,
    List<ChapterQuizSummaryDto> ChapterQuizResults);

public record ErrorResponse(
    string Error,
    [property: JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)] object? Details = null);
