using Knorooms.Api.Configuration;
using Knorooms.Modules.Modules.Authorization.Contracts;
using Knorooms.Modules.Modules.Identity.Contracts;
using Knorooms.SharedKernel.Authorization;
using Knorooms.SharedKernel.Tenancy;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Authorization.Policy;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

namespace Knorooms.Api.Security;

public sealed class PermissionRequirement(string permissionCode) : IAuthorizationRequirement
{
    public string PermissionCode { get; } = permissionCode;
}

public sealed class MfaRequiredFailureReason(IAuthorizationHandler handler, string message)
    : AuthorizationFailureReason(handler, message);

public sealed class KnoroomsAuthorizationPolicyProvider(IOptions<AuthorizationOptions> options)
    : DefaultAuthorizationPolicyProvider(options)
{
    public override async Task<AuthorizationPolicy?> GetPolicyAsync(string policyName)
    {
        var existing = await base.GetPolicyAsync(policyName);
        if (existing is not null)
        {
            return existing;
        }

        if (PermissionCatalog.TryGet(policyName, out _))
        {
            return new AuthorizationPolicyBuilder()
                .RequireAuthenticatedUser()
                .AddRequirements(new PermissionRequirement(policyName))
                .Build();
        }

        return null;
    }
}

/// <summary>
/// AuthorizationHandler que valida permisos globales e institucionales contra membresías activas
/// y concesiones de soporte en base de datos, aplicando políticas de MFA y separación por host.
/// </summary>
public sealed class PermissionAuthorizationHandler(
    IHttpContextAccessor httpContextAccessor,
    ITenantContextAccessor tenantContextAccessor,
    IOptions<TokenSigningOptions> tokenOptions) : AuthorizationHandler<PermissionRequirement>
{
    protected override Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        PermissionRequirement requirement)
    {
        var httpContext = httpContextAccessor.HttpContext;
        if (httpContext is null)
        {
            return Task.CompletedTask;
        }

        if (httpContext.Items[TenantAndIdentityResolutionMiddleware.IdentityHttpContextItemKey]
            is not AuthenticatedRequestIdentity identity)
        {
            return Task.CompletedTask;
        }

        var scope = tenantContextAccessor.Current;
        var enforceMfa = tokenOptions.Value.EnforceMfaForPrivilegedRoles;

        // 1. Permisos de plataforma global (solo válidos en host admin.*)
        if (PermissionCatalog.IsPlatformScoped(requirement.PermissionCode))
        {
            if (scope.HostKind != TenantHostKind.Platform)
            {
                return Task.CompletedTask;
            }

            var allowed = requirement.PermissionCode switch
            {
                PermissionCatalog.PlatformSupportRequestAccess => identity.IsPlatformSupport || identity.IsPlatformAdmin,
                _ => identity.IsPlatformAdmin
            };

            if (!allowed)
            {
                return Task.CompletedTask;
            }

            if (enforceMfa && !identity.HasMultiFactorAuthentication)
            {
                context.Fail(new MfaRequiredFailureReason(
                    this,
                    "Se requiere autenticación multifactor (MFA) para operaciones de administración global o soporte."));
                return Task.CompletedTask;
            }

            context.Succeed(requirement);
            return Task.CompletedTask;
        }

        // 2. Permisos institucionales (solo válidos en host <slug>.* con membresía activa o soporte aprobado)
        if (PermissionCatalog.IsInstitutionScoped(requirement.PermissionCode))
        {
            if (scope.HostKind != TenantHostKind.Institution || !scope.HasResolvedTenant)
            {
                return Task.CompletedTask;
            }

            if (httpContext.Items[TenantAndIdentityResolutionMiddleware.TenantAccessHttpContextItemKey]
                is not ResolvedTenantAccess tenantAccess || !tenantAccess.HasAccess)
            {
                return Task.CompletedTask;
            }

            if (!tenantAccess.EffectivePermissions.Contains(requirement.PermissionCode))
            {
                return Task.CompletedTask;
            }

            if (enforceMfa && tenantAccess.RequiresMultiFactor && !identity.HasMultiFactorAuthentication)
            {
                context.Fail(new MfaRequiredFailureReason(
                    this,
                    "La política de seguridad exige MFA activo para directores, administradores institucionales y soporte."));
                return Task.CompletedTask;
            }

            context.Succeed(requirement);
        }

        return Task.CompletedTask;
    }
}

/// <summary>
/// Personaliza la respuesta 401/403 con ProblemDetails RFC 9457 diferenciando falta de MFA y denegación RBAC/ABAC.
/// </summary>
public sealed class ProblemDetailsAuthorizationMiddlewareResultHandler : IAuthorizationMiddlewareResultHandler
{
    private readonly AuthorizationMiddlewareResultHandler _defaultHandler = new();

    public async Task HandleAsync(
        RequestDelegate next,
        HttpContext context,
        AuthorizationPolicy policy,
        PolicyAuthorizationResult authorizeResult)
    {
        if (authorizeResult.Forbidden)
        {
            var mfaReason = authorizeResult.AuthorizationFailure?.FailureReasons
                .OfType<MfaRequiredFailureReason>()
                .FirstOrDefault();

            context.Response.StatusCode = StatusCodes.Status403Forbidden;
            context.Response.ContentType = "application/problem+json";

            var problem = new ProblemDetails
            {
                Status = StatusCodes.Status403Forbidden,
                Title = mfaReason is not null ? "Multi-Factor Authentication Required" : "Forbidden",
                Detail = mfaReason?.Message ?? "No cuenta con membresía activa o permisos suficientes para realizar esta operación.",
                Type = mfaReason is not null
                    ? "https://knorooms.com/problems/mfa-required"
                    : "https://knorooms.com/problems/forbidden",
                Instance = context.Request.Path
            };
            problem.Extensions["traceId"] = context.TraceIdentifier;

            await context.Response.WriteAsJsonAsync(problem, cancellationToken: context.RequestAborted);
            return;
        }

        await _defaultHandler.HandleAsync(next, context, policy, authorizeResult);
    }
}
