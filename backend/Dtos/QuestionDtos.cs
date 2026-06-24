using System.Text.Json.Serialization;

namespace DevEdu.Api.Dtos;

public record OptionDto(string Id, string Text);

/// <summary>
/// Create-question body. Carries the type-specific correct-answer fields,
/// which are only ever supplied by an Author.
/// </summary>
public record CreateQuestionRequest(
    string? Type,
    string? Scope,
    string? Prompt,
    string? Explanation,
    int Points,
    string? Difficulty,
    List<OptionDto>? Options,
    string? CorrectOptionId,
    List<string>? CorrectOptionIds,
    bool? CorrectAnswer);

/// <summary>
/// Author-facing question DTO — includes correct-answer fields.
/// </summary>
public record QuestionAuthorDto(
    string Id,
    string Scope,
    string Type,
    string Prompt,
    string? Explanation,
    int Points,
    string Difficulty,
    [property: JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)] List<OptionDto>? Options,
    [property: JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)] string? CorrectOptionId,
    [property: JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)] List<string>? CorrectOptionIds,
    [property: JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)] bool? CorrectAnswer);

/// <summary>
/// Learner-facing question DTO — NO correct-answer fields are ever serialized.
/// </summary>
public record QuestionLearnerDto(
    string Id,
    string Scope,
    string Type,
    string Prompt,
    [property: JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)] string? Explanation,
    int Points,
    string Difficulty,
    [property: JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)] List<OptionDto>? Options);
