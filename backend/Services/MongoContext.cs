using DevEdu.Api.Models;
using MongoDB.Driver;

namespace DevEdu.Api.Services;

public class MongoOptions
{
    public string ConnectionString { get; set; } = "mongodb://localhost:27017";
    public string Database { get; set; } = "devedu";
}

public class MongoContext
{
    public IMongoDatabase Database { get; }

    public MongoContext(MongoOptions options)
    {
        var client = new MongoClient(options.ConnectionString);
        Database = client.GetDatabase(options.Database);
    }

    public IMongoCollection<User> Users => Database.GetCollection<User>("users");
    public IMongoCollection<Course> Courses => Database.GetCollection<Course>("courses");
    public IMongoCollection<QuestionList> QuestionLists => Database.GetCollection<QuestionList>("questionlists");
    public IMongoCollection<Enrollment> Enrollments => Database.GetCollection<Enrollment>("enrollments");
    public IMongoCollection<Progress> Progress => Database.GetCollection<Progress>("progress");
    public IMongoCollection<Attempt> Attempts => Database.GetCollection<Attempt>("attempts");
    public IMongoCollection<CodeSubmission> CodeSubmissions => Database.GetCollection<CodeSubmission>("codesubmissions");
    public IMongoCollection<ChapterQuizAttempt> ChapterQuizAttempts => Database.GetCollection<ChapterQuizAttempt>("chapterquizattempts");
}
