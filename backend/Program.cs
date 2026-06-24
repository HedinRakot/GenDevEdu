using System.Text;
using System.Text.Json.Serialization;
using DevEdu.Api.Dtos;
using DevEdu.Api.Endpoints;
using DevEdu.Api.Models;
using DevEdu.Api.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

// ---- options ----
var mongoOptions = new MongoOptions
{
    ConnectionString = builder.Configuration["Mongo:ConnectionString"] ?? "mongodb://localhost:27017",
    Database = builder.Configuration["Mongo:Database"] ?? "devedu",
};

var jwtOptions = new JwtOptions
{
    Key = builder.Configuration["Jwt:Key"]
          ?? "dev-only-insecure-signing-key-change-me-please-32bytes-min",
    Issuer = builder.Configuration["Jwt:Issuer"] ?? "devedu",
    Audience = builder.Configuration["Jwt:Audience"] ?? "devedu",
    AccessTokenMinutes = int.TryParse(builder.Configuration["Jwt:AccessTokenMinutes"], out var m) ? m : 60,
    RefreshTokenDays = int.TryParse(builder.Configuration["Jwt:RefreshTokenDays"], out var d) ? d : 14,
};

builder.Services.AddSingleton(mongoOptions);
builder.Services.AddSingleton(jwtOptions);
builder.Services.AddSingleton<MongoContext>();

// ---- services ----
builder.Services.AddScoped<JwtService>();
builder.Services.AddScoped<AuthService>();
builder.Services.AddScoped<CourseService>();
builder.Services.AddScoped<QuestionService>();
builder.Services.AddScoped<EnrollmentService>();
builder.Services.AddScoped<Seeder>();

// ---- JSON: camelCase + ignore nulls where annotated ----
builder.Services.ConfigureHttpJsonOptions(o =>
{
    o.SerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
    o.SerializerOptions.PropertyNameCaseInsensitive = true;
    o.SerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
});

// ---- auth ----
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = jwtOptions.Issuer,
            ValidateAudience = true,
            ValidAudience = jwtOptions.Audience,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtOptions.Key)),
            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromSeconds(30),
            RoleClaimType = System.Security.Claims.ClaimTypes.Role,
            NameClaimType = System.Security.Claims.ClaimTypes.NameIdentifier,
        };
    });
builder.Services.AddAuthorizationBuilder()
    .AddPolicy(Policies.AuthorOrAdmin, p => p.RequireRole(Roles.Author, Roles.Admin));

// ---- CORS (dev: allow anything) ----
const string CorsPolicy = "AllowAll";
builder.Services.AddCors(options =>
{
    options.AddPolicy(CorsPolicy, policy =>
        policy.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod());
});

var app = builder.Build();

// ---- consistent error envelope for auth failures ----
app.UseExceptionHandler(handler =>
{
    handler.Run(async context =>
    {
        context.Response.ContentType = "application/json";
        await context.Response.WriteAsJsonAsync(new ErrorResponse("Internal server error."));
    });
});

app.UseCors(CorsPolicy);
app.UseAuthentication();
app.UseAuthorization();

// ---- health (anonymous) ----
app.MapGet("/health", () => Results.Ok(new { status = "ok" }))
   .AllowAnonymous();

// ---- feature endpoints ----
app.MapAuthEndpoints();
app.MapCourseEndpoints();
app.MapQuestionEndpoints();
app.MapEnrollmentEndpoints();

// ---- seed on startup ----
using (var scope = app.Services.CreateScope())
{
    var seeder = scope.ServiceProvider.GetRequiredService<Seeder>();
    try
    {
        await seeder.SeedAsync();
    }
    catch (Exception ex)
    {
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "Seeding failed (continuing startup).");
    }
}

app.Run();

// Exposed for potential integration tests.
public partial class Program { }
