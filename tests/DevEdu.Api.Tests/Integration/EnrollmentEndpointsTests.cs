using System.Net;
using System.Net.Http.Json;
using DevEdu.Api.Dtos;
using Xunit;

namespace DevEdu.Api.Tests.Integration;

[Collection(IntegrationCollection.Name)]
public class EnrollmentEndpointsTests
{
    private readonly HttpClient _client;

    public EnrollmentEndpointsTests(DevEduApiFactory factory) => _client = factory.CreateClient();

    [Fact]
    public async Task Enroll_UnpublishedCourse_Returns400()
    {
        var courseId = await Scenarios.CreateCourse(_client, "author-enr-draft"); // bleibt Draft
        var res = await _client.PostAsAsync("/api/enrollments", "learner-draft", body: new { courseId });
        Assert.Equal(HttpStatusCode.BadRequest, res.StatusCode);
    }

    [Fact]
    public async Task Enroll_PublishedCourse_IsIdempotent()
    {
        var (courseId, _, _) = await Scenarios.PublishedCourseWithLesson(_client, "author-enr");
        const string learner = "learner-enr";

        var first = await _client.PostAsAsync("/api/enrollments", learner, body: new { courseId });
        first.EnsureSuccessStatusCode();
        var e1 = await first.Content.ReadFromJsonAsync<EnrollmentDto>();

        var second = await _client.PostAsAsync("/api/enrollments", learner, body: new { courseId });
        second.EnsureSuccessStatusCode();
        var e2 = await second.Content.ReadFromJsonAsync<EnrollmentDto>();

        // Zweite Einschreibung legt keinen neuen Datensatz an.
        Assert.Equal(e1!.Id, e2!.Id);
    }

    [Fact]
    public async Task CompleteContent_RecordsProgress()
    {
        var (courseId, _, contentId) = await Scenarios.PublishedCourseWithLesson(_client, "author-prog");
        const string learner = "learner-prog";
        await _client.PostAsAsync("/api/enrollments", learner, body: new { courseId });

        var complete = await _client.PostAsAsync($"/api/content/{contentId}/complete", learner);
        complete.EnsureSuccessStatusCode();

        var progRes = await _client.GetAsAsync("/api/me/progress", learner);
        progRes.EnsureSuccessStatusCode();
        var progress = await progRes.Content.ReadFromJsonAsync<List<ProgressDto>>();

        var entry = Assert.Single(progress!, p => p.CourseId == courseId);
        Assert.Contains(contentId, entry.CompletedChapterContentIds);
    }
}
