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

// Chapter quiz submission
public record QuizAnswerDto(string QuestionId, AnswerDto? Answer);
public record SubmitChapterQuizRequest(List<QuizAnswerDto>? Answers);

public record QuizAnswerResultDto(
    string QuestionId,
    bool IsCorrect,
    int Score,
    [property: JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)] string? Explanation);

public record ChapterQuizResultDto(
    string ChapterId,
    int EarnedPoints,
    int TotalPoints,
    int PassingThresholdPct,
    bool Passed,
    List<QuizAnswerResultDto> Results);
