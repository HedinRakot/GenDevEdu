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
        var hasUsers = await _db.Users.Find(FilterDefinition<User>.Empty).AnyAsync();
        if (hasUsers)
        {
            _logger.LogInformation("Seed skipped: database already has users.");
            return;
        }

        _logger.LogInformation("Seeding initial DevEdu data...");

        var author = new User
        {
            Email = "author@devedu.local",
            DisplayName = "Demo Author",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Passw0rd!"),
            Roles = new List<string> { Roles.Author },
        };
        var learner = new User
        {
            Email = "learner@devedu.local",
            DisplayName = "Demo Learner",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Passw0rd!"),
            Roles = new List<string> { Roles.Learner },
        };
        await _db.Users.InsertManyAsync(new[] { author, learner });

        // ---- Demo course "C# Grundlagen" ----
        var topic = new Topic
        {
            Title = "Variablen & Typen",
            Order = 1,
            Examples = new List<Example>
            {
                new()
                {
                    Title = "Variablen deklarieren",
                    Order = 1,
                    Language = "csharp",
                    ContentBlocks = new List<ContentBlock>
                    {
                        new()
                        {
                            Kind = "markdown",
                            Text = "In C# deklarierst du eine Variable mit **Typ** und **Name**. " +
                                   "Mit `var` kann der Compiler den Typ herleiten.",
                        },
                        new()
                        {
                            Kind = "code",
                            Language = "csharp",
                            Text = "int alter = 30;\nstring name = \"Ada\";\nvar pi = 3.14; // double",
                        },
                    },
                },
            },
        };

        var chapter = new Chapter
        {
            Title = "Einführung",
            Description = "Grundlegende Sprachkonzepte von C#.",
            Order = 1,
            Topics = new List<Topic> { topic },
        };

        var course = new Course
        {
            Title = "C# Grundlagen",
            Slug = Slug.From("C# Grundlagen"),
            Description = "Ein Einsteigerkurs in die Sprache C#.",
            Tags = new List<string> { "csharp", "dotnet", "basics" },
            Level = "Beginner",
            Status = CourseStatus.Published,
            AuthorId = author.Id,
            Chapters = new List<Chapter> { chapter },
        };
        await _db.Courses.InsertOneAsync(course);

        // ---- 3 questions on the topic ----
        var single = new Question
        {
            CourseId = course.Id,
            Scope = QuestionScope.Topic,
            TopicId = topic.Id,
            Type = QuestionType.SingleChoice,
            Prompt = "Mit welchem Schlüsselwort lässt du den Compiler den Typ einer lokalen Variable herleiten?",
            Explanation = "`var` weist den Compiler an, den statischen Typ aus dem Initialisierer abzuleiten.",
            Points = 1,
            Difficulty = "Easy",
            Options = new List<QuestionOption>
            {
                new() { Text = "var" },
                new() { Text = "dynamic" },
                new() { Text = "let" },
                new() { Text = "auto" },
            },
        };
        single.CorrectOptionId = single.Options[0].Id;

        var multiple = new Question
        {
            CourseId = course.Id,
            Scope = QuestionScope.Topic,
            TopicId = topic.Id,
            Type = QuestionType.MultipleChoice,
            Prompt = "Welche der folgenden sind eingebaute Werttypen (value types) in C#?",
            Explanation = "`int`, `bool` und `double` sind Werttypen; `string` ist ein Referenztyp.",
            Points = 2,
            Difficulty = "Medium",
            Options = new List<QuestionOption>
            {
                new() { Text = "int" },
                new() { Text = "bool" },
                new() { Text = "double" },
                new() { Text = "string" },
            },
        };
        multiple.CorrectOptionIds = new List<string>
        {
            multiple.Options[0].Id,
            multiple.Options[1].Id,
            multiple.Options[2].Id,
        };

        var trueFalse = new Question
        {
            CourseId = course.Id,
            Scope = QuestionScope.Topic,
            TopicId = topic.Id,
            Type = QuestionType.TrueFalse,
            Prompt = "In C# ist `string` ein Referenztyp.",
            Explanation = "Richtig — `string` (System.String) ist ein Referenztyp, verhält sich aber unveränderlich.",
            Points = 1,
            Difficulty = "Easy",
            CorrectAnswer = true,
        };

        // ---- 1 chapter-scoped question (Kapitelquiz) ----
        var chapterQuiz = new Question
        {
            CourseId = course.Id,
            Scope = QuestionScope.Chapter,
            ChapterId = chapter.Id,
            Type = QuestionType.TrueFalse,
            Prompt = "C# ist eine statisch typisierte Sprache.",
            Explanation = "Richtig — Typen werden zur Kompilierzeit geprüft, nicht erst zur Laufzeit.",
            Points = 1,
            Difficulty = "Easy",
            CorrectAnswer = true,
        };

        await _db.Questions.InsertManyAsync(new[] { single, multiple, trueFalse, chapterQuiz });

        _logger.LogInformation("Seeding complete. Demo course id: {CourseId}", course.Id);
    }
}
