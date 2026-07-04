using DevEdu.Api.Models;
using DevEdu.Api.Services.Chat;
using MongoDB.Driver;
using Xunit;

namespace DevEdu.Api.Tests.Integration;

[Collection(IntegrationCollection.Name)]
public class ChatContextBuilderTests
{
    private readonly DevEduApiFactory _factory;

    public ChatContextBuilderTests(DevEduApiFactory factory) => _factory = factory;

    private static Texte De(string text) => new() { Items = { new TextItem { Text = text, Language = 1 } } };

    [Fact]
    public async Task Build_InjectsCourseChapterLessonAndQuestion()
    {
        var courseId = $"ctx-course-{Guid.NewGuid():N}";
        var chapterId = $"ctx-ch-{Guid.NewGuid():N}";
        var contentId = $"ctx-cc-{Guid.NewGuid():N}";
        var questionId = $"ctx-q-{Guid.NewGuid():N}";

        var content = new ChapterContent
        {
            Id = contentId,
            ElementId = contentId,
            Titel = De("Schleifen"),
            ContentType = ChapterContentType.Lesson,
            LessonTexte = De("Eine for-Schleife wiederholt einen Block mehrfach."),
        };
        var chapter = new Chapter { Id = chapterId, ElementId = chapterId, Titel = De("Kontrollfluss"), ChapterContent = { content } };
        var course = new Course { Id = courseId, ElementId = courseId, Name = "dotnet", Titel = De("C# Grundlagen"), Chapters = { chapter } };
        await _factory.Db.Courses.InsertOneAsync(course);

        var ql = new QuestionList
        {
            CourseId = courseId,
            Questions = { new Question { Id = questionId, ElementId = questionId, Titel = De("Wie viele Durchläufe hat die Schleife?") } },
        };
        await _factory.Db.QuestionLists.InsertOneAsync(ql);

        var builder = new ChatContextBuilder(_factory.Db);
        var ctx = await builder.BuildAsync(new ChatContext(courseId, chapterId, contentId, questionId), null, CancellationToken.None);

        Assert.NotNull(ctx);
        Assert.Contains("C# Grundlagen", ctx!);
        Assert.Contains("Kontrollfluss", ctx);
        Assert.Contains("Schleifen", ctx);
        Assert.Contains("for-Schleife wiederholt", ctx);
        Assert.Contains("Wie viele Durchläufe", ctx);
    }

    [Fact]
    public async Task Build_CodeQuestion_IncludesStarterAndLastError_ButNeverSolution()
    {
        var userId = $"coder-{Guid.NewGuid():N}";
        var questionId = $"ctx-code-{Guid.NewGuid():N}";

        var ql = new QuestionList
        {
            CourseId = "c",
            Questions =
            {
                new Question
                {
                    Id = questionId,
                    ElementId = questionId,
                    Titel = De("Gib die Summe 1..n aus."),
                    QuestionType = MobileQuestionType.Code,
                    Code = new CodeQuestion
                    {
                        StarterCode = "var n = int.Parse(Console.ReadLine()!);",
                        SolutionCode = "SECRET_SOLUTION_CODE_XYZ",
                    },
                },
            },
        };
        await _factory.Db.QuestionLists.InsertOneAsync(ql);

        await _factory.Db.CodeSubmissions.InsertOneAsync(new CodeSubmission
        {
            UserId = userId,
            QuestionId = questionId,
            Outcome = CodeRunOutcome.CompileError,
            CompileError = "error CS1002: ; expected",
            CreatedAt = DateTime.UtcNow,
        });

        var builder = new ChatContextBuilder(_factory.Db);
        var ctx = await builder.BuildAsync(new ChatContext(QuestionId: questionId), userId, CancellationToken.None);

        Assert.NotNull(ctx);
        Assert.Contains("Programmieraufgabe", ctx!);
        Assert.Contains("var n = int.Parse", ctx);       // Startcode
        Assert.Contains("CS1002", ctx);                  // letzter Fehler
        Assert.Contains("NIEMALS die vollständige Lösung", ctx);  // Guardrail
        Assert.DoesNotContain("SECRET_SOLUTION_CODE_XYZ", ctx);   // Lösung NIE ausliefern
    }

    [Fact]
    public async Task Build_QuizExplanation_IncludesOptionsCorrectnessAndSelection()
    {
        var questionId = $"ctx-quiz-{Guid.NewGuid():N}";
        var ql = new QuestionList
        {
            CourseId = "c",
            Questions =
            {
                new Question
                {
                    Id = questionId,
                    ElementId = questionId,
                    Titel = De("Ist string ein Werttyp?"),
                    QuestionType = MobileQuestionType.TrueFalse,
                    Answers =
                    {
                        new Answer { IsCorrect = false, Titel = De("Wahr") },
                        new Answer { IsCorrect = true, Titel = De("Falsch") },
                    },
                },
            },
        };
        await _factory.Db.QuestionLists.InsertOneAsync(ql);

        var builder = new ChatContextBuilder(_factory.Db);
        var ctx = await builder.BuildAsync(
            new ChatContext(QuestionId: questionId, SelectedAnswer: "Wahr"), null, CancellationToken.None);

        Assert.NotNull(ctx);
        Assert.Contains("Quizfrage", ctx!);
        Assert.Contains("Falsch (richtig)", ctx);              // korrekte Option markiert
        Assert.Contains("Der Lerner hat gewählt: Wahr", ctx);
        Assert.Contains("Erkläre", ctx);
    }

    [Fact]
    public async Task Build_ReturnsNull_WhenNoContext()
    {
        var builder = new ChatContextBuilder(_factory.Db);
        Assert.Null(await builder.BuildAsync(null, null, CancellationToken.None));
    }

    [Fact]
    public async Task Build_FindsCourseViaChapter_WhenCourseIdMissing()
    {
        var chapterId = $"ctx-ch2-{Guid.NewGuid():N}";
        var chapter = new Chapter { Id = chapterId, ElementId = chapterId, Titel = De("Vererbung") };
        var course = new Course { Id = $"c-{Guid.NewGuid():N}", Name = "dotnet", Titel = De("C# Grundlagen"), Chapters = { chapter } };
        await _factory.Db.Courses.InsertOneAsync(course);

        var builder = new ChatContextBuilder(_factory.Db);
        var ctx = await builder.BuildAsync(new ChatContext(ChapterId: chapterId), null, CancellationToken.None);

        Assert.NotNull(ctx);
        Assert.Contains("Vererbung", ctx!);
    }
}
