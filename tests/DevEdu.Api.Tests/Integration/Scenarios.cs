using System.Net.Http.Json;
using DevEdu.Api.Dtos;
using DevEdu.Api.Models;

namespace DevEdu.Api.Tests.Integration;

/// <summary>
/// Baut über die echte Author-API wiederverwendbare Testdaten (Kurs/Kapitel/Inhalt),
/// damit Integrationstests denselben Pfad wie die Produktion nehmen.
/// </summary>
public static class Scenarios
{
    public static CreateCourseRequest CourseReq(string name) =>
        new(name, new List<TextItemDto> { new(name, 1) }, new List<string> { "test" }, CourseLevel.Beginner);

    public static async Task<string> CreateCourse(HttpClient c, string author, string? name = null)
    {
        name ??= $"Course {Guid.NewGuid():N}";
        var res = await c.PostAsAsync("/api/courses", author, "instructor", CourseReq(name));
        res.EnsureSuccessStatusCode();
        return (await res.Content.ReadFromJsonAsync<CourseDto>())!.ElementId;
    }

    public static async Task<string> AddChapter(HttpClient c, string author, string courseId)
    {
        var req = new CreateChapterRequest("Chapter", new List<TextItemDto> { new("Kapitel", 1) }, 1, true);
        var res = await c.PostAsAsync($"/api/courses/{courseId}/chapters", author, "instructor", req);
        res.EnsureSuccessStatusCode();
        return (await res.Content.ReadFromJsonAsync<ChapterResponseDto>())!.ElementId;
    }

    public static async Task<string> AddLesson(HttpClient c, string author, string chapterId)
    {
        var req = new CreateChapterContentRequest(
            "Lesson", new List<TextItemDto> { new("Lektion", 1) },
            ContentType: 0, LessonText: "Inhalt", SortOrder: 1);
        var res = await c.PostAsAsync($"/api/chapters/{chapterId}/content", author, "instructor", req);
        res.EnsureSuccessStatusCode();
        return (await res.Content.ReadFromJsonAsync<ChapterContentDto>())!.ElementId;
    }

    public static async Task Publish(HttpClient c, string author, string courseId)
    {
        var res = await c.PostAsAsync($"/api/courses/{courseId}/publish", author, "instructor");
        res.EnsureSuccessStatusCode();
    }

    /// <summary>Veröffentlichter Kurs mit einem Kapitel und einer Lektion (kein Quiz).</summary>
    public static async Task<(string courseId, string chapterId, string contentId)>
        PublishedCourseWithLesson(HttpClient c, string author)
    {
        var courseId = await CreateCourse(c, author);
        var chapterId = await AddChapter(c, author, courseId);
        var contentId = await AddLesson(c, author, chapterId);
        await Publish(c, author, courseId);
        return (courseId, chapterId, contentId);
    }

    /// <summary>Ein einzelnes OneChoice-Fragerequest mit genau einer korrekten Antwort.</summary>
    public static CreateQuestionRequest OneChoiceQuestion(string prompt, string correct, string wrong) =>
        new(
            Name: prompt,
            TitelItems: new List<TextItemDto> { new(prompt, 1) },
            QuestionType: (int)MobileQuestionType.OneChoice,
            Answers: new List<CreateAnswerRequest>
            {
                new(true, new List<TextItemDto> { new(correct, 1) }, null),
                new(false, new List<TextItemDto> { new(wrong, 1) }, null),
            },
            AnswerValue: null,
            Code: null);
}
