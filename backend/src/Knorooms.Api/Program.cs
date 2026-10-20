using FluentValidation;
using Knorooms.Api.Configuration;
using Knorooms.Api.Security;
using Knorooms.Modules;
using Knorooms.Modules.Common.Persistence;
using Knorooms.Modules.Modules.Identity.Contracts;
using Knorooms.Modules.Modules.Platform.Contracts;
using Knorooms.SharedKernel.Tenancy;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Options;
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
builder.Services.Configure<TokenSigningOptions>(
    builder.Configuration.GetSection(TokenSigningOptions.SectionName));
builder.Services.Configure<PasswordPolicyOptions>(
    builder.Configuration.GetSection(PasswordPolicyOptions.SectionName));

var enableOutboxWorker = builder.Configuration.GetValue("Database:EnableOutboxWorker", true);

builder.Services.AddKnoroomsModules(connectionStringOverride: null, enableOutboxWorker);

builder.Services.AddHttpContextAccessor();
builder.Services.AddProblemDetails();
builder.Services.AddControllers();
builder.Services.AddValidatorsFromAssemblyContaining<Program>();
builder.Services.AddOpenApi();

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer();

builder.Services
    .AddOptions<JwtBearerOptions>(JwtBearerDefaults.AuthenticationScheme)
    .Configure<IOptions<TokenSigningOptions>>((options, tokenOptionsAccessor) =>
    {
        var tokenSettings = tokenOptionsAccessor.Value;
        options.MapInboundClaims = false;
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = tokenSettings.Issuer,
            ValidateAudience = true,
            ValidAudience = tokenSettings.Audience,
            ValidateLifetime = true,
            RequireExpirationTime = true,
            RequireSignedTokens = true,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(tokenSettings.GetSigningKeyBytes()),
            ValidAlgorithms = [SecurityAlgorithms.HmacSha256],
            ClockSkew = TimeSpan.FromSeconds(Math.Clamp(tokenSettings.ClockSkewSeconds, 0, 120)),
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
        var tokenOptions = scope.ServiceProvider.GetRequiredService<IOptions<TokenSigningOptions>>().Value;
        await DatabaseSeedAndInitializer.SeedDevelopmentSampleDataAsync(
            db,
            tenantAccessor,
            platformService,
            tokenOptions.Issuer,
            logger);
    }
}

await app.RunAsync();

public partial class Program;
