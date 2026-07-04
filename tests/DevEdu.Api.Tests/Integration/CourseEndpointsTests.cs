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

    private async Task<List<string>> ListNames(string sub, string? role = null)
    {
        var res = await _client.GetAsAsync("/api/courses", sub, role);
        res.EnsureSuccessStatusCode();
        var courses = await res.Content.ReadFromJsonAsync<List<CourseDto>>();
        return courses!.Select(c => c.Name).ToList();
    }
}
