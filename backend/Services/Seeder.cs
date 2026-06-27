using DevEdu.Api.Models;
using MongoDB.Driver;

namespace DevEdu.Api.Services;

public class Seeder
{
    private readonly MongoContext _db;
    private readonly ILogger<Seeder> _logger;

    public Seeder(MongoContext db, ILogger<Seeder> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task SeedAsync()
    {
        var hasCourses = await _db.Courses.Find(FilterDefinition<Course>.Empty).AnyAsync();
        if (hasCourses)
        {
            _logger.LogInformation("Seed skipped: database already has courses.");
            return;
        }

        _logger.LogInformation("Seeding demo course...");

        // ─── Demo-Kurs ────────────────────────────────────────────────────────

        var courseId = Guid.NewGuid().ToString("N");

        // Kapitel 1: Einführung
        var chapterId = Guid.NewGuid().ToString("N");
        var chapterQuizId = Guid.NewGuid().ToString("N");

        // Inhalt 1: Lektion
        var lessonId = Guid.NewGuid().ToString("N");
        var lesson = new ChapterContent
        {
            Id = lessonId,
            ElementId = lessonId,
            Name = "Variables",
            CourseId = courseId,
            ChapterId = chapterId,
            Titel = Bi("Variablen & Typen", "Variables & Types"),
            ContentType = ChapterContentType.Lesson,
            LessonText = "In C# deklarierst du eine Variable mit Typ und Name.",
            LessonTexte = Bi(
                "In C# deklarierst du eine Variable mit **Typ** und **Name**. " +
                "Mit `var` kann der Compiler den Typ herleiten.\n\n```csharp\nint alter = 30;\nstring name = \"Ada\";\nvar pi = 3.14;\n```",
                "In C# you declare a variable with a **type** and a **name**. " +
                "With `var` the compiler infers the type.\n\n```csharp\nint age = 30;\nstring name = \"Ada\";\nvar pi = 3.14;\n```"),
            SortOrder = 1,
        };

        // Inhalt 2: Quiz
        var quizId = Guid.NewGuid().ToString("N");
        var quiz = new ChapterContent
        {
            Id = quizId,
            ElementId = quizId,
            Name = "Quiz",
            CourseId = courseId,
            ChapterId = chapterId,
            Titel = Bi("Wissenstest", "Knowledge Quiz"),
            ContentType = ChapterContentType.Questions,
            SortOrder = 2,
        };

        var chapter = new Chapter
        {
            Id = chapterId,
            ElementId = chapterId,
            Name = "Introduction",
            CourseId = courseId,
            Titel = Bi("Einführung", "Introduction"),
            SortOrder = 1,
            Show = true,
            ChapterContent = new List<ChapterContent> { lesson, quiz },
            // F8: Kapitel-Abschlussquiz (60 % zum Bestehen, max. 3 Versuche).
            ChapterQuizId = chapterQuizId,
            PassThresholdPercent = 60,
            MaxAttempts = 3,
        };

        var course = new Course
        {
            Id = courseId,
            ElementId = courseId,
            Name = "CSharp Basics",
            AuthorId = "system",
            Status = CourseStatus.Published,
            Titel = Bi("C# Grundlagen", "C# Basics"),
            Chapters = new List<Chapter> { chapter },
        };

        await _db.Courses.InsertOneAsync(course);

        // ─── QuestionList für den Quiz-Inhalt ─────────────────────────────────

        var qlId = Guid.NewGuid().ToString("N");
        var q1Id = Guid.NewGuid().ToString("N");
        var q2Id = Guid.NewGuid().ToString("N");
        var q3Id = Guid.NewGuid().ToString("N");
        var q4Id = Guid.NewGuid().ToString("N");

        var questionList = new QuestionList
        {
            Id = qlId,
            ElementId = qlId,
            CourseId = courseId,
            ChapterContentId = quizId,
            Questions = new List<Question>
            {
                new()
                {
                    Id = q1Id,
                    ElementId = q1Id,
                    Name = "Q1",
                    Titel = Bi(
                        "Mit welchem Schlüsselwort lässt der Compiler den Typ herleiten?",
                        "Which keyword lets the compiler infer the type?"),
                    QuestionType = MobileQuestionType.OneChoice,
                    Answers = new List<Answer>
                    {
                        new() { IsCorrect = true,  Titel = Bi("var", "var"),     Comment = "" },
                        new() { IsCorrect = false, Titel = Bi("dynamic", "dynamic"), Comment = "" },
                        new() { IsCorrect = false, Titel = Bi("let", "let"),     Comment = "" },
                        new() { IsCorrect = false, Titel = Bi("auto", "auto"),   Comment = "" },
                    },
                },
                new()
                {
                    Id = q2Id,
                    ElementId = q2Id,
                    Name = "Q2",
                    Titel = Bi(
                        "Welche sind eingebaute Werttypen in C#?",
                        "Which are built-in value types in C#?"),
                    QuestionType = MobileQuestionType.MultipleChoice,
                    Answers = new List<Answer>
                    {
                        new() { IsCorrect = true,  Titel = Bi("int", "int"),       Comment = "" },
                        new() { IsCorrect = true,  Titel = Bi("bool", "bool"),     Comment = "" },
                        new() { IsCorrect = true,  Titel = Bi("double", "double"), Comment = "" },
                        new() { IsCorrect = false, Titel = Bi("string", "string"), Comment = "string ist ein Referenztyp." },
                    },
                },
                new()
                {
                    Id = q3Id,
                    ElementId = q3Id,
                    Name = "Q3",
                    Titel = Bi(
                        "In C# ist `string` ein Referenztyp.",
                        "In C#, `string` is a reference type."),
                    QuestionType = MobileQuestionType.TrueFalse,
                    Answers = new List<Answer>
                    {
                        new() { IsCorrect = true,  Titel = Bi("Wahr", "True"),
                            Comment = "string ist ein Referenztyp (immutable)." },
                        new() { IsCorrect = false, Titel = Bi("Falsch", "False"), Comment = "" },
                    },
                },
                new()
                {
                    Id = q4Id,
                    ElementId = q4Id,
                    Name = "Q4",
                    Titel = Bi(
                        "Schreibe ein Programm, das eine Zahl von stdin liest und ihr Doppeltes ausgibt.",
                        "Write a program that reads a number from stdin and prints its double."),
                    QuestionType = MobileQuestionType.Code,
                    Code = new CodeQuestion
                    {
                        Language = CodeLanguage.CSharp,
                        StarterCode =
                            "var n = int.Parse(Console.ReadLine()!);\n// TODO: gib n * 2 aus\n",
                        SolutionCode =
                            "var n = int.Parse(Console.ReadLine()!);\nConsole.WriteLine(n * 2);\n",
                        TimeLimitMs = 5000,
                        MemoryLimitMb = 256,
                        TestCases = new List<CodeTestCase>
                        {
                            new() { Input = "3\n",  ExpectedOutput = "6",  Hidden = false },
                            new() { Input = "10\n", ExpectedOutput = "20", Hidden = true  },
                        },
                    },
                },
            },
        };

        await _db.QuestionLists.InsertOneAsync(questionList);

        // ─── F8: Kapitel-Abschlussquiz (eigene QuestionList, an Kapitel gebunden) ──

        var cq1Id = Guid.NewGuid().ToString("N");
        var cq2Id = Guid.NewGuid().ToString("N");
        var chapterQuiz = new QuestionList
        {
            Id = chapterQuizId,
            ElementId = chapterQuizId,
            CourseId = courseId,
            ChapterId = chapterId,
            ChapterContentId = string.Empty,
            Questions = new List<Question>
            {
                new()
                {
                    Id = cq1Id,
                    ElementId = cq1Id,
                    Name = "CQ1",
                    Titel = Bi("Welcher Typ ist ein Werttyp?", "Which type is a value type?"),
                    QuestionType = MobileQuestionType.OneChoice,
                    Answers = new List<Answer>
                    {
                        new() { IsCorrect = true,  Titel = Bi("int", "int"),       Comment = "" },
                        new() { IsCorrect = false, Titel = Bi("string", "string"), Comment = "string ist ein Referenztyp." },
                        new() { IsCorrect = false, Titel = Bi("object", "object"), Comment = "" },
                    },
                },
                new()
                {
                    Id = cq2Id,
                    ElementId = cq2Id,
                    Name = "CQ2",
                    Titel = Bi("`var` leitet den Typ zur Compile-Zeit her.", "`var` infers the type at compile time."),
                    QuestionType = MobileQuestionType.TrueFalse,
                    Answers = new List<Answer>
                    {
                        new() { IsCorrect = true,  Titel = Bi("Wahr", "True"),   Comment = "Der Compiler bestimmt den statischen Typ." },
                        new() { IsCorrect = false, Titel = Bi("Falsch", "False"), Comment = "" },
                    },
                },
            },
        };
        await _db.QuestionLists.InsertOneAsync(chapterQuiz);

        // QuestionListId im Quiz-Inhalt setzen
        await _db.Courses.UpdateOneAsync(
            c => c.Id == courseId,
            Builders<Course>.Update.Set(
                "Chapters.$[ch].ChapterContent.$[cc].QuestionListId", qlId),
            new UpdateOptions
            {
                ArrayFilters = new List<ArrayFilterDefinition>
                {
                    new BsonDocumentArrayFilterDefinition<MongoDB.Bson.BsonDocument>(
                        new MongoDB.Bson.BsonDocument("ch.Id", chapterId)),
                    new BsonDocumentArrayFilterDefinition<MongoDB.Bson.BsonDocument>(
                        new MongoDB.Bson.BsonDocument("cc.Id", quizId)),
                }
            });

        _logger.LogInformation("Seeding complete. Course id: {CourseId}, QuestionList id: {QlId}",
            courseId, qlId);
    }

    private static Texte Bi(string de, string en) => new()
    {
        Items = new List<TextItem>
        {
            new() { Text = de, Language = 1 }, // German
            new() { Text = en, Language = 2 }, // English
        }
    };
}
