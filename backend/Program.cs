using System.Net.Http.Headers;
using System.Security.Claims;
using System.Text.Json.Serialization;
using DevEdu.Api.Endpoints;
using DevEdu.Api.Models;
using DevEdu.Api.Services;
using DevEdu.Api.Services.CodeExecution;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

// ---- MongoDB ----
var mongoOptions = new MongoOptions
{
    ConnectionString = builder.Configuration["Mongo:ConnectionString"] ?? "mongodb://localhost:27017",
    Database = builder.Configuration["Mongo:Database"] ?? "devedu",
};
builder.Services.AddSingleton(mongoOptions);
builder.Services.AddSingleton<MongoContext>();

// ---- services ----
builder.Services.AddScoped<CourseService>();
builder.Services.AddScoped<QuestionService>();
builder.Services.AddScoped<ChapterQuizService>();
builder.Services.AddScoped<EnrollmentService>();
builder.Services.AddScoped<StatsService>();
builder.Services.AddScoped<Seeder>();

// ---- F7: Code-Aufgaben & Sandbox ----
var sandboxOptions = new SandboxOptions
{
    PodmanSocketUri = builder.Configuration["Sandbox:PodmanSocketUri"] ?? "unix:///podman/podman.sock",
    RunnerImage = builder.Configuration["Sandbox:RunnerImage"] ?? "localhost/devedu/csharp-runner:local",
    ScratchDir = builder.Configuration["Sandbox:ScratchDir"] ?? "/sandbox",
};
builder.Services.AddSingleton(sandboxOptions);
builder.Services.AddSingleton<ICodeSubmissionQueue, CodeSubmissionQueue>();
builder.Services.AddSingleton<ISandboxRunner, PodmanSandboxRunner>();
builder.Services.AddScoped<CodeSubmissionService>();
builder.Services.AddHostedService<CodeExecutionWorker>();

// ---- JSON: camelCase ----
builder.Services.ConfigureHttpJsonOptions(o =>
{
    o.SerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
    o.SerializerOptions.PropertyNameCaseInsensitive = true;
    o.SerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
});

// ---- Clerk JWT-Auth ─────────────────────────────────────────────────────────
// Authority: Clerk Frontend API URL, z. B. https://your-app.clerk.accounts.dev
// Konfiguration in appsettings.json (oder Umgebungsvariablen):
//   "Clerk": { "Authority": "https://...", "WebhookSecret": "whsec_..." }
//
// Im Clerk Dashboard → JWT Templates → Template anlegen:
//   Name: DevEdu  Payload: { "role": "{{user.public_metadata.role}}" }
var clerkAuthority = builder.Configuration["Clerk:Authority"]
                     ?? "https://your-app.clerk.accounts.dev"; // <-- Platzhalter

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        // Authority lädt das OpenID-Connect-Discovery-Dokument und damit die JWKS.
        options.Authority = clerkAuthority;
        // Claims unverändert lassen ("role"/"sub" behalten ihre Namen), damit die
        // ClerkRoleClaimsTransformation den rohen "role"-Claim zuverlässig findet.
        options.MapInboundClaims = false;
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateAudience = false,               // Clerk setzt standardmäßig kein aud
            NameClaimType = "sub",                  // Clerk user ID als Name-Claim
            // Rollen werden von ClerkRoleClaimsTransformation als ClaimTypes.Role
            // hinzugefügt (z. B. instructor → Author); Policies/EndpointHelpers lesen
            // ebenfalls ClaimTypes.Role. Den rohen "role"-Claim NICHT als RoleClaimType
            // setzen, sonst prüfen RequireRole/IsInRole den falschen Claim-Typ.
            RoleClaimType = ClaimTypes.Role,
        };
    });

// ClaimsTransformation: "role" (Clerk) → ClaimTypes.Role (.NET RBAC)
builder.Services.AddTransient<IClaimsTransformation, ClerkRoleClaimsTransformation>();

builder.Services.AddAuthorizationBuilder()
    .AddPolicy(Policies.AuthorOrAdmin, p => p.RequireRole(Roles.Author, Roles.Admin))
    .AddPolicy(Policies.AdminOnly, p => p.RequireRole(Roles.Admin));

// ---- Clerk Backend API (Admin-Rollenverwaltung) ----
// Secret-Key aus Clerk:SecretKey (appsettings/Env). Leer => Admin-Endpunkte
// liefern eine klare Fehlermeldung statt zu crashen.
builder.Services.AddHttpClient<ClerkAdminService>(client =>
{
    client.BaseAddress = new Uri("https://api.clerk.com/v1/");
    var secret = builder.Configuration["Clerk:SecretKey"];
    if (!string.IsNullOrWhiteSpace(secret))
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", secret);
});

// ---- CORS ----
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
        await context.Response.WriteAsJsonAsync(new { error = "Internal server error." });
    });
});

app.UseCors(CorsPolicy);
app.UseAuthentication();
app.UseAuthorization();

app.MapGet("/health", () => Results.Ok(new { status = "ok" })).AllowAnonymous();

// Friendly landing endpoints so hitting the base URL / "/api" in a browser returns
// a 200 reachability signal instead of a bare 404. The real REST endpoints live
// under /api/<resource> (courses, questions, enrollments, auth) — mapped below.
static IResult ApiInfo() => Results.Ok(new
{
    service = "DevEdu API",
    status = "ok",
    health = "/health",
    endpoints = new[] { "/api/courses", "/api/enrollments", "/api/me/progress" },
});
app.MapGet("/", ApiInfo).AllowAnonymous();
app.MapGet("/api", ApiInfo).AllowAnonymous();

app.MapAuthEndpoints();
app.MapCourseEndpoints();
app.MapQuestionEndpoints();
app.MapEnrollmentEndpoints();
app.MapAdminEndpoints();
app.MapCodeSubmissionEndpoints();
app.MapChapterQuizEndpoints();

using (var scope = app.Services.CreateScope())
{
    var seeder = scope.ServiceProvider.GetRequiredService<Seeder>();
    try { await seeder.SeedAsync(); }
    catch (Exception ex)
    {
        scope.ServiceProvider.GetRequiredService<ILogger<Program>>()
             .LogError(ex, "Seeding failed (continuing startup).");
    }
}

app.Run();

public partial class Program { }

// ─── Clerk Claims Transformation ─────────────────────────────────────────────
/// <summary>
/// Mappt den "role"-Claim aus dem Clerk-JWT-Template auf ClaimTypes.Role,
/// damit .NET RBAC (.RequireRole, [Authorize(Roles=…)]) funktioniert.
/// </summary>
public class ClerkRoleClaimsTransformation : IClaimsTransformation
{
    public Task<ClaimsPrincipal> TransformAsync(ClaimsPrincipal principal)
    {
        if (principal.Identity is not ClaimsIdentity identity)
            return Task.FromResult(principal);

        // Clerk-Rollenname (instructor/admin/learner) → interner Rollenname
        var clerkRole = identity.FindFirst("role")?.Value;
        var appRole = clerkRole switch
        {
            "instructor" => Roles.Author,
            "admin" => Roles.Admin,
            _ => Roles.Learner,
        };

        if (!identity.HasClaim(ClaimTypes.Role, appRole))
            identity.AddClaim(new Claim(ClaimTypes.Role, appRole));

        return Task.FromResult(principal);
    }
}
