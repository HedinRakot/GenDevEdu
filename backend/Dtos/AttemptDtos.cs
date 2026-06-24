using System.Text.Json.Serialization;

namespace DevEdu.Api.Dtos;

/// <summary>
/// Answer payload. The relevant fields depend on the question type:
/// SingleChoice -> selectedOptionId, MultipleChoice -> selectedOptionIds, TrueFalse -> value.
/// </summary>
public record AnswerDto(
    string? SelectedOptionId,
    List<string>? SelectedOptionIds,
    bool? Value);

public record AttemptRequest(AnswerDto? Answer);

public record AttemptResultDto(
    bool IsCorrect,
    int Score,
    [property: JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)] string? Explanation);
