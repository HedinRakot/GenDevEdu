using DevEdu.Api.Models;
using MongoDB.Bson;
using MongoDB.Bson.Serialization;
using MongoDB.Bson.Serialization.Serializers;
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

    static MongoContext()
    {
        // F14: DateOnly als "yyyy-MM-dd"-String speichern — lesbar in der DB und
        // Range-Queries funktionieren lexikografisch.
        BsonSerializer.RegisterSerializer(new DateOnlySerializer(BsonType.String));
    }

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
    public IMongoCollection<Certificate> Certificates => Database.GetCollection<Certificate>("certificates");
    public IMongoCollection<CourseEmbedding> CourseEmbeddings => Database.GetCollection<CourseEmbedding>("courseembeddings");
    public IMongoCollection<DailyChallenge> DailyChallenges => Database.GetCollection<DailyChallenge>("dailychallenges");

    // F14: AZAV-Anwesenheitsnachweis
    public IMongoCollection<AttendanceEvent> AttendanceEvents => Database.GetCollection<AttendanceEvent>("attendanceevents");
    public IMongoCollection<TrainingPeriod> TrainingPeriods => Database.GetCollection<TrainingPeriod>("trainingperiods");
    public IMongoCollection<ExcusedAbsence> ExcusedAbsences => Database.GetCollection<ExcusedAbsence>("excusedabsences");
    public IMongoCollection<DailyAttendance> DailyAttendance => Database.GetCollection<DailyAttendance>("dailyattendance");

    /// <summary>Idempotente Index-Anlage (beim Start aufgerufen). Erzwingt 1 Zertifikat/Kurs/Nutzer.</summary>
    public async Task EnsureIndexesAsync()
    {
        var unique = new CreateIndexOptions { Unique = true };
        var keys = Builders<Certificate>.IndexKeys.Ascending(c => c.UserId).Ascending(c => c.CourseId);
        await Certificates.Indexes.CreateOneAsync(new CreateIndexModel<Certificate>(keys, unique));

        // F14: Retry-Dedup + Range-Scans für Recompute/Export
        await AttendanceEvents.Indexes.CreateManyAsync(new[]
        {
            new CreateIndexModel<AttendanceEvent>(
                Builders<AttendanceEvent>.IndexKeys.Ascending(e => e.UserId).Ascending(e => e.ClientEventId), unique),
            new CreateIndexModel<AttendanceEvent>(
                Builders<AttendanceEvent>.IndexKeys.Ascending(e => e.UserId).Ascending(e => e.OccurredAt)),
        });
        await DailyAttendance.Indexes.CreateManyAsync(new[]
        {
            new CreateIndexModel<DailyAttendance>(
                Builders<DailyAttendance>.IndexKeys.Ascending(d => d.UserId).Ascending(d => d.Date), unique),
            new CreateIndexModel<DailyAttendance>(
                Builders<DailyAttendance>.IndexKeys.Ascending(d => d.Date)),
        });
        await ExcusedAbsences.Indexes.CreateOneAsync(new CreateIndexModel<ExcusedAbsence>(
            Builders<ExcusedAbsence>.IndexKeys.Ascending(e => e.UserId).Ascending(e => e.Date), unique));
        await TrainingPeriods.Indexes.CreateOneAsync(new CreateIndexModel<TrainingPeriod>(
            Builders<TrainingPeriod>.IndexKeys.Ascending(p => p.UserId)));
    }
}
