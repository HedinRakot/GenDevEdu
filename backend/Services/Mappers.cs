using DevEdu.Api.Dtos;
using DevEdu.Api.Models;

namespace DevEdu.Api.Services;

public static class Mappers
{
    public static CourseSummaryDto ToSummary(Course c) =>
        new(c.Id, c.Title, c.Slug, c.Description, c.Tags, c.Level, c.Status);

    public static ContentBlockDto ToBlockDto(ContentBlock b) =>
        new(b.Kind, b.Text, b.Language);

    public static ExampleDto ToExampleDto(Example e) =>
        new(e.Id, e.Title, e.ContentBlocks.Select(ToBlockDto).ToList(), e.Language, e.Order);

    public static QuestionAuthorDto ToAuthorQuestion(Question q)
    {
        var options = IsChoice(q.Type) ? q.Options.Select(o => new OptionDto(o.Id, o.Text)).ToList() : null;
        return new QuestionAuthorDto(
            q.Id, q.Scope, q.Type, q.Prompt, q.Explanation, q.Points, q.Difficulty,
            options,
            q.Type == QuestionType.SingleChoice ? q.CorrectOptionId : null,
            q.Type == QuestionType.MultipleChoice ? q.CorrectOptionIds : null,
            q.Type == QuestionType.TrueFalse ? q.CorrectAnswer : null);
    }

    public static QuestionLearnerDto ToLearnerQuestion(Question q)
    {
        var options = IsChoice(q.Type) ? q.Options.Select(o => new OptionDto(o.Id, o.Text)).ToList() : null;
        // Note: explanation is intentionally NOT exposed in the course-tree learner view;
        // it is only returned after an attempt. Pass null here.
        return new QuestionLearnerDto(q.Id, q.Scope, q.Type, q.Prompt, null, q.Points, q.Difficulty, options);
    }

    /// <summary>
    /// Builds the full course tree. When <paramref name="includeAnswers"/> is true,
    /// questions include correct-answer fields (Author view); otherwise they are stripped (Learner view).
    /// </summary>
    public static CourseTreeDto ToTree(Course c, List<Question> questions, bool includeAnswers)
    {
        object MapQuestion(Question q) =>
            includeAnswers ? ToAuthorQuestion(q) : ToLearnerQuestion(q);

        var chapters = c.Chapters
            .OrderBy(ch => ch.Order)
            .Select(ch =>
            {
                var chapterQuestions = questions
                    .Where(q => q.Scope == QuestionScope.Chapter && q.ChapterId == ch.Id)
                    .Select(MapQuestion)
                    .ToList();

                var topics = ch.Topics
                    .OrderBy(t => t.Order)
                    .Select(t =>
                    {
                        var topicQuestions = questions
                            .Where(q => q.Scope == QuestionScope.Topic && q.TopicId == t.Id)
                            .Select(MapQuestion)
                            .ToList();

                        var examples = t.Examples
                            .OrderBy(e => e.Order)
                            .Select(ToExampleDto)
                            .ToList();

                        return new TopicDto(t.Id, t.Title, t.Order, examples, topicQuestions);
                    })
                    .ToList();

                return new ChapterDto(ch.Id, ch.Title, ch.Order, ch.Description, topics, chapterQuestions);
            })
            .ToList();

        return new CourseTreeDto(c.Id, c.Title, c.Slug, c.Description, c.Tags, c.Level, c.Status, chapters);
    }

    private static bool IsChoice(string type) =>
        type == QuestionType.SingleChoice || type == QuestionType.MultipleChoice;
}
