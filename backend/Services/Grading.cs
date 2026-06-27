using DevEdu.Api.Models;

namespace DevEdu.Api.Services;

/// <summary>
/// Geteilte Bewertungs-Logik für eine einzelne Frage – genutzt von der
/// Einzel-Attempt-Auswertung (<see cref="QuestionService"/>) und vom
/// Kapitel-Abschlussquiz (<see cref="ChapterQuizService"/>).
/// </summary>
public static class Grading
{
    /// <summary>Score in Prozent (kaufmännisch gerundet); 0 bei leerem Quiz.</summary>
    public static int Percent(int correct, int total) =>
        total > 0 ? (int)Math.Round(correct * 100.0 / total) : 0;

    /// <summary>Auto-bewertbare Fragetypen (Code/OwnAnswer werden nicht automatisch bewertet).</summary>
    public static bool IsAutoGradable(MobileQuestionType type) =>
        type is MobileQuestionType.OneChoice
             or MobileQuestionType.MultipleChoice
             or MobileQuestionType.TrueFalse;

    public static bool IsCorrect(Question q, string? answerId, List<string>? answerIds) =>
        q.QuestionType switch
        {
            // TrueFalse wird wie OneChoice bewertet: genau eine der beiden Antworten
            // ist korrekt und wird über AnswerId eingereicht.
            MobileQuestionType.OneChoice or MobileQuestionType.TrueFalse =>
                !string.IsNullOrEmpty(answerId) &&
                q.Answers.Any(a => a.Id == answerId && a.IsCorrect),

            MobileQuestionType.MultipleChoice =>
                answerIds is not null &&
                answerIds.Distinct().ToHashSet()
                    .SetEquals(q.Answers.Where(a => a.IsCorrect).Select(a => a.Id)),

            MobileQuestionType.OwnAnswer => false, // manuelle Bewertung
            _ => false,
        };
}
