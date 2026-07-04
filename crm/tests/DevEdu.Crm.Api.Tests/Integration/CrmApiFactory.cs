using System.Text.Json;
using System.Text.Json.Serialization;
using DevEdu.Crm.Api.Services;
using EphemeralMongo;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Xunit;

namespace DevEdu.Crm.Api.Tests.Integration;

/// <summary>
/// Bootet die echte Minimal-API (Program) gegen ein wegwerfbares Mongo (EphemeralMongo).
/// Keine Auth-Ersetzung nötig — die CRM-API hat in v1 keine Authentifizierung.
///
/// Eine Instanz (ein mongod-Prozess, eine DB) wird über die xUnit-Collection geteilt —
/// Tests isolieren sich über eindeutige Teilnehmer (eigene IDs/Namen pro Test).
/// </summary>
public class CrmApiFactory : WebApplicationFactory<Program>
{
    private readonly IMongoRunner _mongo;

    public CrmApiFactory()
    {
        _mongo = MongoRunner.Run(new MongoRunnerOptions { UseSingleNodeReplicaSet = false });

        // WICHTIG: Beim Minimal-Hosting liest Program die Mongo-Konfiguration aus
        // builder.Configuration, BEVOR die ConfigureAppConfiguration-Callbacks der
        // Factory greifen. Umgebungsvariablen (Mongo__*) sind Teil der Default-
        // Konfiguration und werden rechtzeitig gelesen — daher hier setzen.
        Environment.SetEnvironmentVariable("Mongo__ConnectionString", _mongo.ConnectionString);
        Environment.SetEnvironmentVariable("Mongo__Database", "devedu_crm_test");
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.ConfigureLogging(l => l.SetMinimumLevel(LogLevel.Warning));
    }

    /// <summary>Direkter DB-Zugriff zum Arrangieren/Prüfen von Testdaten.</summary>
    public MongoContext Db => Services.GetRequiredService<MongoContext>();

    protected override void Dispose(bool disposing)
    {
        base.Dispose(disposing);
        if (disposing)
        {
            _mongo.Dispose();
            Environment.SetEnvironmentVariable("Mongo__ConnectionString", null);
            Environment.SetEnvironmentVariable("Mongo__Database", null);
        }
    }
}

[CollectionDefinition(Name)]
public class CrmIntegrationCollection : ICollectionFixture<CrmApiFactory>
{
    public const string Name = "crm-integration";
}

/// <summary>JSON-Optionen wie in Program.cs — camelCase inkl. Enum-Strings.</summary>
public static class TestJson
{
    public static readonly JsonSerializerOptions Options = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        PropertyNameCaseInsensitive = true,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
        Converters = { new JsonStringEnumConverter(JsonNamingPolicy.CamelCase) },
    };
}
