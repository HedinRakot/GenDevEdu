using System.Net.Http.Json;
using DevEdu.Api.Dtos;
using MongoDB.Driver;
using Xunit;

namespace DevEdu.Api.Tests.Integration;

[Collection(IntegrationCollection.Name)]
public class CertificateFlowTests
{
    private readonly DevEduApiFactory _factory;
    private readonly HttpClient _client;

    public CertificateFlowTests(DevEduApiFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task CompletingOnlyContent_IssuesCertificate_Idempotently()
    {
        // Kurs mit genau einem Kapitel + einer Lektion, kein Kapitelquiz →
        // Abschluss des Inhalts schließt den Kurs ab.
        var (courseId, _, contentId) = await Scenarios.PublishedCourseWithLesson(_client, "author-cert");
        const string learner = "learner-cert";

        await _client.PostAsAsync("/api/enrollments", learner, body: new { courseId });

        // Abschluss → Zertifikat wird ausgestellt.
        var c1 = await _client.PostAsAsync($"/api/content/{contentId}/complete", learner);
        c1.EnsureSuccessStatusCode();

        var certRes = await _client.GetAsAsync("/api/me/certificates", learner);
        certRes.EnsureSuccessStatusCode();
        var certs = await certRes.Content.ReadFromJsonAsync<List<CertificateDto>>();

        var cert = Assert.Single(certs!, c => c.CourseId == courseId);
        Assert.False(string.IsNullOrEmpty(cert.VerificationCode));

        // Erneuter Abschluss-Trigger stellt KEIN zweites Zertifikat aus (Idempotenz).
        var c2 = await _client.PostAsAsync($"/api/content/{contentId}/complete", learner);
        c2.EnsureSuccessStatusCode();

        Assert.Equal(1, await _factory.Db.Certificates
            .CountDocumentsAsync(c => c.UserId == learner && c.CourseId == courseId));
    }

    [Fact]
    public async Task IncompleteCourse_IssuesNoCertificate()
    {
        // Kurs mit zwei Lektionen — nur eine wird abgeschlossen.
        var courseId = await Scenarios.CreateCourse(_client, "author-cert2");
        var chapterId = await Scenarios.AddChapter(_client, "author-cert2", courseId);
        var content1 = await Scenarios.AddLesson(_client, "author-cert2", chapterId);
        await Scenarios.AddLesson(_client, "author-cert2", chapterId);
        await Scenarios.Publish(_client, "author-cert2", courseId);

        const string learner = "learner-cert2";
        await _client.PostAsAsync("/api/enrollments", learner, body: new { courseId });
        await _client.PostAsAsync($"/api/content/{content1}/complete", learner);

        Assert.Equal(0, await _factory.Db.Certificates
            .CountDocumentsAsync(c => c.UserId == learner && c.CourseId == courseId));
    }
}
