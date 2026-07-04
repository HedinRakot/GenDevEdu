using System.Text.Json;
using System.Text.Json.Serialization;
using DevEdu.Crm.Api.Endpoints;
using DevEdu.Crm.Api.Services;
using DevEdu.Crm.Api.Services.Email;
using Microsoft.AspNetCore.Diagnostics;

var builder = WebApplication.CreateBuilder(args);

// ---- MongoDB ----
var mongoOptions = new MongoOptions
{
    ConnectionString = builder.Configuration["Mongo:ConnectionString"] ?? "mongodb://localhost:27017",
    Database = builder.Configuration["Mongo:Database"] ?? "devedu_crm",
};
builder.Services.AddSingleton(mongoOptions);
builder.Services.AddSingleton<MongoContext>();

// ---- services ----
builder.Services.AddScoped<ParticipantService>();
builder.Services.AddScoped<ActivityService>();
builder.Services.AddScoped<EmailTemplateService>();
builder.Services.AddScoped<Seeder>();
// v1: kein echter Versand — Vorschau-Modus. Später per Config-Switch (Email:Sender)
// gegen einen SmtpEmailSender austauschbar, ohne Endpoints/Frontend anzufassen.
builder.Services.AddSingleton<IEmailSender, NoOpEmailSender>();

// ---- JSON: camelCase, Enums als camelCase-Strings ----
builder.Services.ConfigureHttpJsonOptions(o =>
{
    o.SerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
    o.SerializerOptions.PropertyNameCaseInsensitive = true;
    o.SerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
    o.SerializerOptions.Converters.Add(new JsonStringEnumConverter(JsonNamingPolicy.CamelCase));
});

// ---- CORS (internes Tool ohne Auth, Vite-Dev-Server greift auch direkt zu) ----
const string CorsPolicy = "AllowAll";
builder.Services.AddCors(options =>
{
    options.AddPolicy(CorsPolicy, policy =>
        policy.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod());
});

var app = builder.Build();

app.UseExceptionHandler(handler =>
{
    handler.Run(async context =>
    {
        context.Response.ContentType = "application/json";

        // Body-Binding-Fehler (z. B. ungültiger Enum-String) landen im Development-
        // Modus als BadHttpRequestException hier — als 400 statt 500 beantworten.
        var error = context.Features.Get<IExceptionHandlerFeature>()?.Error;
        if (error is BadHttpRequestException bad)
        {
            context.Response.StatusCode = bad.StatusCode;
            await context.Response.WriteAsJsonAsync(new { error = "Ungültige Anfrage." });
            return;
        }

        context.Response.StatusCode = StatusCodes.Status500InternalServerError;
        await context.Response.WriteAsJsonAsync(new { error = "Internal server error." });
    });
});

app.UseCors(CorsPolicy);

app.MapGet("/health", () => Results.Ok(new { status = "ok" }));

static IResult ApiInfo() => Results.Ok(new
{
    service = "DevEdu CRM API",
    status = "ok",
    health = "/health",
    endpoints = new[] { "/api/participants", "/api/dashboard", "/api/email-templates/welcome" },
});
app.MapGet("/", ApiInfo);
app.MapGet("/api", ApiInfo);

app.MapParticipantEndpoints();
app.MapActivityEndpoints();
app.MapEmailEndpoints();
app.MapDashboardEndpoints();

using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        await services.GetRequiredService<MongoContext>().EnsureIndexesAsync();
        await services.GetRequiredService<Seeder>().SeedAsync();
    }
    catch (Exception ex)
    {
        services.GetRequiredService<ILogger<Program>>()
            .LogError(ex, "Index-/Seed-Initialisierung fehlgeschlagen (Start wird fortgesetzt).");
    }
}

app.Run();

public partial class Program { }
