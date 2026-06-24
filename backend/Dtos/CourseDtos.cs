namespace DevEdu.Api.Dtos;

// ---- responses ----

public record CourseSummaryDto(
    string Id,
    string Title,
    string Slug,
    string Description,
    List<string> Tags,
    string Level,
    string Status);

public record ContentBlockDto(string Kind, string Text, string? Language);

public record ExampleDto(
    string Id,
    string Title,
    List<ContentBlockDto> ContentBlocks,
    string? Language,
    int Order);

public record TopicDto(
    string Id,
    string Title,
    int Order,
    List<ExampleDto> Examples,
    List<object> Questions);

public record ChapterDto(
    string Id,
    string Title,
    int Order,
    string Description,
    List<TopicDto> Topics,
    List<object> Questions);

public record CourseTreeDto(
    string Id,
    string Title,
    string Slug,
    string Description,
    List<string> Tags,
    string Level,
    string Status,
    List<ChapterDto> Chapters);

// ---- requests ----

public record CreateCourseRequest(string? Title, string? Description, List<string>? Tags, string? Level);

public record UpdateCourseRequest(string? Title, string? Description, List<string>? Tags, string? Level);

public record CreateChapterRequest(string? Title, string? Description, int Order);

public record CreateTopicRequest(string? Title, int Order);

public record CreateExampleRequest(string? Title, List<ContentBlockDto>? ContentBlocks, string? Language, int Order);
