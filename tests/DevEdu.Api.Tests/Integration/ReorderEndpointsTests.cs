using System.Net;
using System.Net.Http.Json;
using DevEdu.Api.Dtos;
using Xunit;

namespace DevEdu.Api.Tests.Integration;

/// <summary>
/// Reorder-Endpoints: PUT /api/courses/{id}/chapters/order und
/// PUT /api/chapters/{id}/contents/order (vollständige, geordnete Id-Liste).
/// </summary>
[Collection(IntegrationCollection.Name)]
public class ReorderEndpointsTests
{
    private readonly HttpClient _client;

    public ReorderEndpointsTests(DevEduApiFactory factory) => _client = factory.CreateClient();

    private async Task<(string courseId, List<string> chapterIds)> CourseWithChapters(string author, int count)
    {
        var courseId = await Scenarios.CreateCourse(_client, author);
        var ids = new List<string>();
        for (var i = 0; i < count; i++)
            ids.Add(await Scenarios.AddChapter(_client, author, courseId));
        return (courseId, ids);
    }

    private async Task<List<string>> GetChapterOrder(string courseId, string sub)
    {
        var res = await _client.GetAsAsync($"/api/courses/{courseId}/chapters", sub, "instructor");
        res.EnsureSuccessStatusCode();
        var model = await res.Content.ReadFromJsonAsync<ChapterListModel>();
        return model!.Chapters.Select(ch => ch.ElementId).ToList();
    }

    [Fact]
    public async Task ReorderChapters_Author_PersistsNewOrder()
    {
        const string author = "author-reorder";
        var (courseId, ids) = await CourseWithChapters(author, 3);

        var reversed = Enumerable.Reverse(ids).ToList();
        var res = await _client.PutAsAsync($"/api/courses/{courseId}/chapters/order", author, "instructor",
            new { orderedIds = reversed });
        Assert.Equal(HttpStatusCode.NoContent, res.StatusCode);

        Assert.Equal(reversed, await GetChapterOrder(courseId, author));
    }

    [Fact]
    public async Task ReorderChapters_IncompleteList_Returns400()
    {
        const string author = "author-reorder-bad";
        var (courseId, ids) = await CourseWithChapters(author, 3);

        var res = await _client.PutAsAsync($"/api/courses/{courseId}/chapters/order", author, "instructor",
            new { orderedIds = ids.Take(2).ToList() });
        Assert.Equal(HttpStatusCode.BadRequest, res.StatusCode);
    }

    [Fact]
    public async Task ReorderChapters_OtherAuthor_Returns403()
    {
        var (courseId, ids) = await CourseWithChapters("owner-reorder", 2);
        var res = await _client.PutAsAsync($"/api/courses/{courseId}/chapters/order", "intruder-reorder", "instructor",
            new { orderedIds = Enumerable.Reverse(ids).ToList() });
        Assert.Equal(HttpStatusCode.Forbidden, res.StatusCode);
    }

    [Fact]
    public async Task ReorderContents_Author_PersistsNewOrder()
    {
        const string author = "author-reorder-cc";
        var courseId = await Scenarios.CreateCourse(_client, author);
        var chapterId = await Scenarios.AddChapter(_client, author, courseId);
        var contentIds = new List<string>
        {
            await Scenarios.AddLesson(_client, author, chapterId),
            await Scenarios.AddLesson(_client, author, chapterId),
            await Scenarios.AddLesson(_client, author, chapterId),
        };

        var reversed = Enumerable.Reverse(contentIds).ToList();
        var res = await _client.PutAsAsync($"/api/chapters/{chapterId}/contents/order", author, "instructor",
            new { orderedIds = reversed });
        Assert.Equal(HttpStatusCode.NoContent, res.StatusCode);

        var read = await _client.GetAsAsync($"/api/chapters/{chapterId}/content", author, "instructor");
        read.EnsureSuccessStatusCode();
        var model = await read.Content.ReadFromJsonAsync<ChapterContentListModel>();
        Assert.Equal(reversed, model!.ChapterContent.Select(cc => cc.ElementId).ToList());
    }

    [Fact]
    public async Task AddChapter_WithoutSortOrder_AppendsAtEnd()
    {
        const string author = "author-append";
        var courseId = await Scenarios.CreateCourse(_client, author);
        var first = await Scenarios.AddChapter(_client, author, courseId);

        // Ohne SortOrder (default 0) → ans Ende, nicht an den Anfang.
        var req = new CreateChapterRequest("Later", new List<TextItemDto> { new("Später", 1) });
        var res = await _client.PostAsAsync($"/api/courses/{courseId}/chapters", author, "instructor", req);
        res.EnsureSuccessStatusCode();
        var second = (await res.Content.ReadFromJsonAsync<ChapterResponseDto>())!.ElementId;

        Assert.Equal(new List<string> { first, second }, await GetChapterOrder(courseId, author));
    }
}
