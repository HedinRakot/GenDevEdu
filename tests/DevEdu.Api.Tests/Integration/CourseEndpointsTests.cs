using System.Net;
using System.Net.Http.Json;
using DevEdu.Api.Dtos;
using DevEdu.Api.Models;
using MongoDB.Driver;
using Xunit;

namespace DevEdu.Api.Tests.Integration;

[Collection(IntegrationCollection.Name)]
public class CourseEndpointsTests
{
    private readonly DevEduApiFactory _factory;
    private readonly HttpClient _client;

    public CourseEndpointsTests(DevEduApiFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    private static CreateCourseRequest NewCourse(string name) =>
        new(name, new List<TextItemDto> { new(name, 1) }, new List<string> { "test" }, CourseLevel.Beginner);

    [Fact]
    public async Task ListCourses_Anonymous_Returns401()
    {
        var res = await _client.GetAsync("/api/courses");
        Assert.Equal(HttpStatusCode.Unauthorized, res.StatusCode);
    }

    [Fact]
    public async Task ListCourses_Learner_SeesSeededPublishedCourse()
    {
        var res = await _client.GetAsAsync("/api/courses", sub: "learner-list");
        res.EnsureSuccessStatusCode();
        var courses = await res.Content.ReadFromJsonAsync<List<CourseDto>>();

        Assert.NotNull(courses);
        Assert.Contains(courses!, c => c.Name == "CSharp Basics" && c.Status == CourseStatus.Published);
    }

    [Fact]
    public async Task CreateCourse_Learner_Returns403()
    {
        var res = await _client.PostAsAsync("/api/courses", sub: "learner-create",
            body: NewCourse("Learner Attempt"));
        Assert.Equal(HttpStatusCode.Forbidden, res.StatusCode);
    }

    [Fact]
    public async Task DraftCourse_HiddenFromLearner_UntilPublished()
    {
        const string author = "author-publish";
        var name = $"Publish Flow {Guid.NewGuid():N}";

        // Author legt einen Draft an.
        var created = await _client.PostAsAsync("/api/courses", author, "instructor", NewCourse(name));
        created.EnsureSuccessStatusCode();
        var dto = await created.Content.ReadFromJsonAsync<CourseDto>();
        Assert.Equal(CourseStatus.Draft, dto!.Status);
        var courseId = dto.ElementId;

        // Learner sieht den Draft NICHT.
        var learnerBefore = await ListNames(sub: "learner-x");
        Assert.DoesNotContain(name, learnerBefore);

        // Autor sieht den eigenen Draft.
        var authorView = await ListNames(author, "instructor");
        Assert.Contains(name, authorView);

        // Publizieren → Learner sieht ihn.
        var pub = await _client.PostAsAsync($"/api/courses/{courseId}/publish", author, "instructor");
        pub.EnsureSuccessStatusCode();

        var learnerAfter = await ListNames(sub: "learner-x");
        Assert.Contains(name, learnerAfter);
    }

    [Fact]
    public async Task Publish_OtherAuthorsCourse_Returns403()
    {
        var name = $"Owned {Guid.NewGuid():N}";
        var created = await _client.PostAsAsync("/api/courses", "owner-a", "instructor", NewCourse(name));
        var dto = await created.Content.ReadFromJsonAsync<CourseDto>();

        var res = await _client.PostAsAsync($"/api/courses/{dto!.ElementId}/publish", "intruder-b", "instructor");
        Assert.Equal(HttpStatusCode.Forbidden, res.StatusCode);
    }

    [Fact]
    public async Task DeleteCourse_CascadesEnrollmentsAndProgress()
    {
        const string author = "author-delete";
        var name = $"Delete Me {Guid.NewGuid():N}";

        var created = await _client.PostAsAsync("/api/courses", author, "instructor", NewCourse(name));
        var dto = await created.Content.ReadFromJsonAsync<CourseDto>();
        var courseId = dto!.ElementId;
        await _client.PostAsAsync($"/api/courses/{courseId}/publish", author, "instructor");

        // Ein Lerner schreibt sich ein → Enrollment + Progress entstehen.
        var enroll = await _client.PostAsAsync("/api/enrollments", "learner-del", body: new { courseId });
        enroll.EnsureSuccessStatusCode();
        Assert.True(await _factory.Db.Enrollments.CountDocumentsAsync(e => e.CourseId == courseId) > 0);

        // Löschen kaskadiert.
        var del = await _client.DeleteAsAsync($"/api/courses/{courseId}", author, "instructor");
        Assert.Equal(HttpStatusCode.NoContent, del.StatusCode);

        Assert.Equal(0, await _factory.Db.Courses.CountDocumentsAsync(c => c.Id == courseId));
        Assert.Equal(0, await _factory.Db.Enrollments.CountDocumentsAsync(e => e.CourseId == courseId));
        Assert.Equal(0, await _factory.Db.Progress.CountDocumentsAsync(p => p.CourseId == courseId));
    }

    // ─── Inhalt bearbeiten (PUT /api/content/{id}) ────────────────────────────

    private static CreateChapterContentRequest UpdateReq(
        string name, string titelDe, string lessonText, int sortOrder) =>
        new(name, new List<TextItemDto> { new(titelDe, 1) },
            ContentType: 0, LessonText: lessonText, SortOrder: sortOrder);

    [Fact]
    public async Task UpdateChapterContent_Author_PersistsChanges()
    {
        const string author = "author-cc-update";
        var (courseId, chapterId, contentId) = await Scenarios.PublishedCourseWithLesson(_client, author);

        var res = await _client.PutAsAsync($"/api/content/{contentId}", author, "instructor",
            UpdateReq("lesson-renamed", "Neuer Titel", "Aktualisierter Markdown", 7));
        res.EnsureSuccessStatusCode();

        var dto = await res.Content.ReadFromJsonAsync<ChapterContentDto>();
        Assert.NotNull(dto);
        Assert.Equal(contentId, dto!.ElementId);              // Identität bleibt erhalten
        Assert.Equal("lesson-renamed", dto.Name);
        Assert.Equal("Aktualisierter Markdown", dto.LessonText);
        Assert.Equal(7, dto.SortOrder);
        Assert.Contains(dto.Titel.Items, i => i.Text == "Neuer Titel");

        // Persistenz über den Lese-Pfad gegenprüfen.
        var listRes = await _client.GetAsAsync($"/api/chapters/{chapterId}/content", author, "instructor");
        var list = await listRes.Content.ReadFromJsonAsync<ChapterContentListModel>();
        var reread = list!.ChapterContent.Single(c => c.ElementId == contentId);
        Assert.Equal("lesson-renamed", reread.Name);
        Assert.Equal(7, reread.SortOrder);
        Assert.Equal("Aktualisierter Markdown", reread.LessonText);
    }

    [Fact]
    public async Task UpdateChapterContent_OtherAuthor_Returns403()
    {
        var (_, _, contentId) = await Scenarios.PublishedCourseWithLesson(_client, "owner-cc");
        var res = await _client.PutAsAsync($"/api/content/{contentId}", "intruder-cc", "instructor",
            UpdateReq("hacked", "Hacked", "x", 1));
        Assert.Equal(HttpStatusCode.Forbidden, res.StatusCode);
    }

    [Fact]
    public async Task UpdateChapterContent_Learner_Returns403()
    {
        var (_, _, contentId) = await Scenarios.PublishedCourseWithLesson(_client, "owner-cc2");
        var res = await _client.PutAsAsync($"/api/content/{contentId}", "learner-cc",
            body: UpdateReq("x", "x", "x", 1));
        Assert.Equal(HttpStatusCode.Forbidden, res.StatusCode);
    }

    [Fact]
    public async Task UpdateChapterContent_Unknown_Returns404()
    {
        var res = await _client.PutAsAsync($"/api/content/{Guid.NewGuid():N}", "author-cc3", "instructor",
            UpdateReq("x", "x", "x", 1));
        Assert.Equal(HttpStatusCode.NotFound, res.StatusCode);
    }

    [Fact]
    public async Task UpdateChapterContent_EmptyName_Returns400()
    {
        const string author = "author-cc4";
        var (_, _, contentId) = await Scenarios.PublishedCourseWithLesson(_client, author);
        var res = await _client.PutAsAsync($"/api/content/{contentId}", author, "instructor",
            new CreateChapterContentRequest("   ", new List<TextItemDto> { new("t", 1) },
                ContentType: 0, SortOrder: 1));
        Assert.Equal(HttpStatusCode.BadRequest, res.StatusCode);
    }

    private async Task<List<string>> ListNames(string sub, string? role = null)
    {
        var res = await _client.GetAsAsync("/api/courses", sub, role);
        res.EnsureSuccessStatusCode();
        var courses = await res.Content.ReadFromJsonAsync<List<CourseDto>>();
        return courses!.Select(c => c.Name).ToList();
    }
}
