using DevEdu.Crm.Api.Models;
using MongoDB.Driver;

namespace DevEdu.Crm.Api.Services;

public class MongoOptions
{
    public string ConnectionString { get; set; } = "mongodb://localhost:27017";
    public string Database { get; set; } = "devedu_crm";
}

public class MongoContext
{
    public IMongoDatabase Database { get; }

    public MongoContext(MongoOptions options)
    {
        var client = new MongoClient(options.ConnectionString);
        Database = client.GetDatabase(options.Database);
    }

    public IMongoCollection<Participant> Participants => Database.GetCollection<Participant>("participants");
    public IMongoCollection<ActivityEntry> Activities => Database.GetCollection<ActivityEntry>("activities");
    public IMongoCollection<EmailTemplate> EmailTemplates => Database.GetCollection<EmailTemplate>("emailtemplates");

    /// <summary>Idempotente Index-Anlage (beim Start aufgerufen).</summary>
    public async Task EnsureIndexesAsync()
    {
        await Participants.Indexes.CreateManyAsync(new[]
        {
            new CreateIndexModel<Participant>(Builders<Participant>.IndexKeys.Ascending(p => p.Phase)),
            new CreateIndexModel<Participant>(Builders<Participant>.IndexKeys.Ascending(p => p.LastName)),
            new CreateIndexModel<Participant>(Builders<Participant>.IndexKeys.Ascending(p => p.Agentur.Kundennummer)),
        });

        await Activities.Indexes.CreateOneAsync(new CreateIndexModel<ActivityEntry>(
            Builders<ActivityEntry>.IndexKeys.Ascending(a => a.ParticipantId).Descending(a => a.CreatedAt)));

        await EmailTemplates.Indexes.CreateOneAsync(new CreateIndexModel<EmailTemplate>(
            Builders<EmailTemplate>.IndexKeys.Ascending(t => t.Key),
            new CreateIndexOptions { Unique = true }));
    }
}
