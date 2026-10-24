using Knorooms.Modules.Modules.Subscriptions.Contracts;
using Knorooms.Modules.Modules.Subscriptions.Application;
using Knorooms.Modules.Modules.Entitlements.Contracts;
using Knorooms.Modules.Modules.Entitlements.Application;
using Knorooms.Modules.Common.Persistence;
using Knorooms.Modules.Modules.Academic.Application;
using Knorooms.Modules.Modules.Academic.Contracts;
using Knorooms.Modules.Modules.Attendance.Application;
using Knorooms.Modules.Modules.Attendance.Contracts;
using Knorooms.Modules.Modules.Audit.Application;
using Knorooms.Modules.Modules.Audit.Contracts;
using Knorooms.Modules.Modules.Authorization.Application;
using Knorooms.Modules.Modules.Authorization.Contracts;
using Knorooms.Modules.Modules.Enrollments.Application;
using Knorooms.Modules.Modules.Enrollments.Contracts;
using Knorooms.Modules.Modules.Grading.Application;
using Knorooms.Modules.Modules.Grading.Contracts;
using Knorooms.Modules.Modules.Identity.Application;
using Knorooms.Modules.Modules.Identity.Contracts;
using Knorooms.Modules.Modules.Identity.Infrastructure;
using Knorooms.Modules.Modules.Platform.Application;
using Knorooms.Modules.Modules.Platform.Contracts;
using Knorooms.Modules.Modules.Platform.Infrastructure;
using Knorooms.Modules.Modules.ReportCards.Application;
using Knorooms.Modules.Modules.ReportCards.Contracts;
using Knorooms.Modules.Modules.Students.Application;
using Knorooms.Modules.Modules.Students.Contracts;
using Knorooms.Modules.Modules.SupportAccess.Application;
using Knorooms.Modules.Modules.SupportAccess.Contracts;
using Knorooms.Modules.Modules.Tenants.Application;
using Knorooms.Modules.Modules.Tenants.Contracts;
using Knorooms.SharedKernel.Tenancy;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Options;
using Microsoft.Extensions.DependencyInjection;

namespace Knorooms.Modules;

public static class ModulesDependencyInjection
{
    public static IServiceCollection AddKnoroomsModules(
        this IServiceCollection services,
        string? connectionStringOverride = null,
        bool enableOutboxBackgroundWorker = true)
    {
        services.AddSingleton<ITenantContextAccessor, TenantContextAccessor>();
        services.AddSingleton<PostgresRlsInterceptor>();

        services.AddOptions<TokenSigningOptions>()
            .BindConfiguration(TokenSigningOptions.SectionName);

        services.AddDbContext<ApplicationDbContext>((sp, options) =>
        {
            var resolvedConnectionString = !string.IsNullOrWhiteSpace(connectionStringOverride)
                ? connectionStringOverride
                : sp.GetRequiredService<IConfiguration>().GetConnectionString("DefaultConnection")
                  ?? "Host=localhost;Port=5432;Database=knorooms;Username=knorooms_app;Password=CHANGE_ME_LOCAL_DEV_ONLY";

            var rlsInterceptor = sp.GetRequiredService<PostgresRlsInterceptor>();
            options.UseNpgsql(resolvedConnectionString, npgsql =>
            {
                npgsql.MigrationsAssembly(typeof(ApplicationDbContext).Assembly.FullName);
                npgsql.MigrationsHistoryTable("__ef_migrations_history", "public");
            });
            options.AddInterceptors(rlsInterceptor);
        });

        services.AddScoped<ISubscriptionService, SubscriptionService>();
        services.AddScoped<IEntitlementService, EntitlementService>();
        services.AddScoped<IInstitutionModulesService, InstitutionModulesService>();
        services.AddScoped<ITenantLookupService, TenantLookupService>();
        services.AddScoped<IIdentityService, IdentityService>();
        services.AddOptions<InvitationOptions>().BindConfiguration(InvitationOptions.SectionName);
        services.AddScoped<IAdministratorInvitationService, AdministratorInvitationService>();
        services.AddScoped<SmtpInvitationEmailSender>();
        // El adaptador posee su HttpClient: cada petición o lote debe disponer de su propia instancia.
        services.AddScoped<ResendInvitationEmailSender>(sp => new ResendInvitationEmailSender(
            new HttpClient(new SocketsHttpHandler { PooledConnectionLifetime = TimeSpan.FromMinutes(5) }) { Timeout = TimeSpan.FromSeconds(15) },
            sp.GetRequiredService<IOptions<InvitationOptions>>()));
        services.AddScoped<IInvitationEmailSender>(sp => sp.GetRequiredService<IOptions<InvitationOptions>>().Value.Provider == "Smtp"
            ? sp.GetRequiredService<SmtpInvitationEmailSender>() : sp.GetRequiredService<ResendInvitationEmailSender>());
        services.AddScoped<IInstitutionProfileService, InstitutionProfileService>();
        services.AddScoped<IInstitutionSetupService, InstitutionSetupService>();
        services.AddScoped<IInstitutionManagementService, InstitutionManagementService>();
        services.AddSingleton<ITokenIssuer, JwtTokenIssuer>();
        services.AddSingleton<IIdentityAuthPolicyProvider, TokenSigningOptionsAuthPolicyProvider>();
        services.AddScoped<ITenantAuthorizationService, TenantAuthorizationService>();
        services.AddScoped<ISupportAccessService, SupportAccessService>();
        services.AddScoped<IAuditWriter, AuditWriter>();
        services.AddScoped<IAuditQueryService, AuditQueryService>();
        services.AddScoped<IAcademicStructureService, AcademicStructureService>();
        services.AddScoped<IStudentDirectoryService, StudentDirectoryService>();
        services.AddScoped<IStudentEnrollmentService, StudentEnrollmentService>();
        services.AddScoped<IAttendanceService, AttendanceService>();
        services.AddScoped<IGradingService, GradingService>();
        services.AddScoped<IReportCardsService, ReportCardsService>();
        services.AddScoped<IPlatformInstitutionService, PlatformInstitutionService>();

        if (enableOutboxBackgroundWorker)
        {
            services.AddHostedService<OutboxProcessorHostedService>();
        }

        return services;
    }
}
