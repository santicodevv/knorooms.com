using FluentValidation;
using Knorooms.Api.Configuration;
using Knorooms.Api.Security;
using Knorooms.Modules;
using Knorooms.Modules.Common.Persistence;
using Knorooms.Modules.Modules.Platform.Contracts;
using Knorooms.SharedKernel.Tenancy;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

builder.Logging.ClearProviders();
builder.Logging.AddJsonConsole(options =>
{
    options.IncludeScopes = true;
    options.TimestampFormat = "yyyy-MM-ddTHH:mm:ss.fffZ";
    options.UseUtcTimestamp = true;
});

builder.Services.Configure<TenancyOptions>(
    builder.Configuration.GetSection(TenancyOptions.SectionName));
builder.Services.Configure<OidcAuthenticationOptions>(
    builder.Configuration.GetSection(OidcAuthenticationOptions.SectionName));

var enableOutboxWorker = builder.Configuration.GetValue("Database:EnableOutboxWorker", true);

builder.Services.AddKnoroomsModules(connectionStringOverride: null, enableOutboxWorker);

builder.Services.AddHttpContextAccessor();
builder.Services.AddProblemDetails();
builder.Services.AddControllers();
builder.Services.AddValidatorsFromAssemblyContaining<Program>();
builder.Services.AddOpenApi();

var oidcSettings = builder.Configuration
    .GetSection(OidcAuthenticationOptions.SectionName)
    .Get<OidcAuthenticationOptions>() ?? new OidcAuthenticationOptions();

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.MapInboundClaims = false;
        if (!string.IsNullOrWhiteSpace(oidcSettings.Authority))
        {
            options.Authority = oidcSettings.Authority;
        }

        if (!string.IsNullOrWhiteSpace(oidcSettings.Audience))
        {
            options.Audience = oidcSettings.Audience;
        }

        options.RequireHttpsMetadata = oidcSettings.RequireHttpsMetadata;
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = !string.IsNullOrWhiteSpace(oidcSettings.Authority),
            ValidateAudience = !string.IsNullOrWhiteSpace(oidcSettings.Audience),
            ValidateLifetime = true,
            RequireExpirationTime = true,
            ClockSkew = TimeSpan.FromSeconds(Math.Clamp(oidcSettings.ClockSkewSeconds, 0, 120)),
            NameClaimType = "name",
            RoleClaimType = "roles"
        };
    });

// Autorización RBAC + ABAC con denegación por defecto para cualquier endpoint no marcado con [AllowAnonymous].
builder.Services.AddSingleton<IAuthorizationPolicyProvider, KnoroomsAuthorizationPolicyProvider>();
builder.Services.AddScoped<IAuthorizationHandler, PermissionAuthorizationHandler>();
builder.Services.AddSingleton<IAuthorizationMiddlewareResultHandler, ProblemDetailsAuthorizationMiddlewareResultHandler>();

builder.Services.AddAuthorizationBuilder()
    .SetFallbackPolicy(new AuthorizationPolicyBuilder()
        .RequireAuthenticatedUser()
        .Build());

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi().AllowAnonymous();
}

app.UseExceptionHandler();
app.UseStatusCodePages();

app.UseAuthentication();
app.UseMiddleware<TenantAndIdentityResolutionMiddleware>();
app.UseAuthorization();

app.MapControllers();

if (app.Configuration.GetValue("Database:AutoMigrateOnStartup", false))
{
    await using var scope = app.Services.CreateAsyncScope();
    var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    var tenantAccessor = scope.ServiceProvider.GetRequiredService<ITenantContextAccessor>();
    var logger = scope.ServiceProvider.GetRequiredService<ILoggerFactory>().CreateLogger("DatabaseStartup");

    await DatabaseSeedAndInitializer.MigrateAndSeedCatalogAsync(db, tenantAccessor, logger);

    if (app.Environment.IsDevelopment() && app.Configuration.GetValue("Database:SeedDevelopmentData", false))
    {
        var platformService = scope.ServiceProvider.GetRequiredService<IPlatformInstitutionService>();
        var issuer = string.IsNullOrWhiteSpace(oidcSettings.Authority)
            ? "http://localhost:8080/realms/knorooms"
            : oidcSettings.Authority;
        await DatabaseSeedAndInitializer.SeedDevelopmentSampleDataAsync(
            db,
            tenantAccessor,
            platformService,
            issuer,
            logger);
    }
}

await app.RunAsync();

public partial class Program;
