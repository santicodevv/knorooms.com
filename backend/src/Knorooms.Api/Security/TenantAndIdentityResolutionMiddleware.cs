using System.Security.Claims;
using Knorooms.Api.Configuration;
using Knorooms.Modules.Modules.Authorization.Contracts;
using Knorooms.Modules.Modules.Identity.Contracts;
using Knorooms.Modules.Modules.Tenants.Contracts;
using Knorooms.Modules.Modules.Tenants.Domain;
using Knorooms.SharedKernel.Tenancy;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

namespace Knorooms.Api.Security;

/// <summary>
/// Middleware central de resolución de subdominio, validación de estado del colegio,
/// aprovisionamiento JIT de identidad OIDC y carga de membresía/permisos en base de datos.
///
/// Reglas críticas:
/// 1. Nunca lee TenantId desde query string, body ni cabeceras arbitrarias del cliente.
/// 2. El subdominio solo identifica el colegio solicitado; el acceso requiere membresía activa o concesión de soporte vigente.
/// </summary>
public sealed class TenantAndIdentityResolutionMiddleware(RequestDelegate next)
{
    public const string IdentityHttpContextItemKey = "Knorooms.AuthenticatedIdentity";
    public const string TenantAccessHttpContextItemKey = "Knorooms.ResolvedTenantAccess";
    public const string TenantInstitutionDtoItemKey = "Knorooms.ResolvedInstitutionDto";

    public async Task InvokeAsync(
        HttpContext httpContext,
        ITenantContextAccessor tenantContextAccessor,
        ITenantLookupService tenantLookupService,
        IIdentityService identityService,
        ITenantAuthorizationService tenantAuthorizationService,
        IOptions<TenancyOptions> tenancyOptions,
        IOptions<OidcAuthenticationOptions> oidcOptions)
    {
        var path = httpContext.Request.Path.Value ?? string.Empty;
        if (path.StartsWith("/health", StringComparison.OrdinalIgnoreCase) ||
            path.StartsWith("/openapi", StringComparison.OrdinalIgnoreCase))
        {
            await next(httpContext);
            return;
        }

        // Rechazar explícitamente cualquier intento del cliente de forzar un TenantId por cabecera o query.
        if (httpContext.Request.Headers.ContainsKey("X-Tenant-Id") ||
            httpContext.Request.Query.ContainsKey("tenantId"))
        {
            await WriteProblemAsync(
                httpContext,
                StatusCodes.Status400BadRequest,
                "Client-Supplied TenantId Prohibited",
                "El cliente no tiene permitido especificar un TenantId por cabecera o parámetro; el tenant se resuelve exclusivamente por subdominio.",
                "https://knorooms.com/problems/client-tenant-id-prohibited");
            return;
        }

        var rawHost = httpContext.Request.Headers["X-Forwarded-Host"].FirstOrDefault();
        if (string.IsNullOrWhiteSpace(rawHost))
        {
            rawHost = httpContext.Request.Host.Value;
        }

        var hostResolution = HostSubdomainParser.Resolve(
            rawHost,
            tenancyOptions.Value.BaseDomain,
            tenancyOptions.Value.PlatformSubdomain);

        if (!hostResolution.IsValid)
        {
            await WriteProblemAsync(
                httpContext,
                StatusCodes.Status400BadRequest,
                "Invalid Host Header",
                hostResolution.FailureReason ?? "El host de la petición no es válido.",
                "https://knorooms.com/problems/invalid-host");
            return;
        }

        // 1. Si el usuario está autenticado vía OIDC Bearer, sincronizar/verificar su cuenta y revocación.
        AuthenticatedRequestIdentity? authenticatedIdentity = null;
        if (httpContext.User.Identity?.IsAuthenticated == true)
        {
            var subject = httpContext.User.FindFirstValue(ClaimTypes.NameIdentifier)
                ?? httpContext.User.FindFirstValue("sub");
            var issuer = httpContext.User.FindFirstValue("iss") ?? oidcOptions.Value.Authority;
            var email = httpContext.User.FindFirstValue(ClaimTypes.Email)
                ?? httpContext.User.FindFirstValue("email")
                ?? $"{subject}@oidc.local";
            var displayName = httpContext.User.FindFirstValue("name")
                ?? httpContext.User.FindFirstValue(ClaimTypes.Name)
                ?? email;

            DateTimeOffset? issuedAtUtc = null;
            if (long.TryParse(httpContext.User.FindFirstValue("iat"), out var iatSeconds))
            {
                issuedAtUtc = DateTimeOffset.FromUnixTimeSeconds(iatSeconds);
            }

            var (isPlatformAdminClaim, isPlatformSupportClaim) =
                ClaimsPrincipalOidcExtractor.ExtractPlatformRoleFlags(httpContext.User);
            var hasMfa = ClaimsPrincipalOidcExtractor.HasMultiFactorClaim(httpContext.User, oidcOptions.Value);

            if (string.IsNullOrWhiteSpace(subject) || string.IsNullOrWhiteSpace(issuer))
            {
                await WriteProblemAsync(
                    httpContext,
                    StatusCodes.Status401Unauthorized,
                    "Invalid OIDC Token",
                    "El token de acceso no contiene los claims estándar obligatorios (sub, iss).",
                    "https://knorooms.com/problems/invalid-token");
                return;
            }

            using (tenantContextAccessor.BeginScope(new ExecutionScopeContext(
                hostResolution.HostKind,
                TenantId: null,
                TenantSlug: null,
                TenantName: null,
                IsTenantSuspended: false,
                UserId: null,
                ExecutionMode: DatabaseExecutionMode.Platform)))
            {
                var userId = await identityService.EnsureUserSynchronizedAsync(
                    new OidcAuthenticatedPrincipal(
                        subject,
                        issuer,
                        email,
                        displayName,
                        isPlatformAdminClaim,
                        isPlatformSupportClaim,
                        hasMfa,
                        issuedAtUtc),
                    httpContext.RequestAborted);

                if (userId is null)
                {
                    await WriteProblemAsync(
                        httpContext,
                        StatusCodes.Status401Unauthorized,
                        "Session Revoked or User Inactive",
                        "La sesión del usuario ha sido revocada o la cuenta se encuentra inactiva.",
                        "https://knorooms.com/problems/session-revoked");
                    return;
                }

                var profile = await identityService.GetCurrentUserProfileAsync(userId.Value, httpContext.RequestAborted);
                authenticatedIdentity = new AuthenticatedRequestIdentity
                {
                    UserId = userId.Value,
                    Email = profile?.Email ?? email,
                    DisplayName = profile?.DisplayName ?? displayName,
                    IsPlatformAdmin = profile?.PlatformRoles.Contains("PlatformAdmin") == true || isPlatformAdminClaim,
                    IsPlatformSupport = profile?.PlatformRoles.Contains("PlatformSupport") == true || isPlatformSupportClaim,
                    HasMultiFactorAuthentication = hasMfa
                };
                httpContext.Items[IdentityHttpContextItemKey] = authenticatedIdentity;
            }
        }

        // 2. Configurar contexto según el tipo de host resuelto.
        if (hostResolution.HostKind == TenantHostKind.Platform)
        {
            var platformContext = new ExecutionScopeContext(
                TenantHostKind.Platform,
                TenantId: null,
                TenantSlug: null,
                TenantName: null,
                IsTenantSuspended: false,
                UserId: authenticatedIdentity?.UserId,
                ExecutionMode: DatabaseExecutionMode.Platform);

            using (tenantContextAccessor.BeginScope(platformContext))
            {
                await next(httpContext);
            }

            return;
        }

        if (hostResolution.HostKind == TenantHostKind.Institution && hostResolution.TenantSlug is not null)
        {
            var institution = await tenantLookupService.FindBySlugAsync(
                hostResolution.TenantSlug,
                httpContext.RequestAborted);

            if (institution is null)
            {
                await WriteProblemAsync(
                    httpContext,
                    StatusCodes.Status404NotFound,
                    "Institution Not Found",
                    $"No existe ninguna institución registrada para el subdominio '{hostResolution.TenantSlug}'.",
                    "https://knorooms.com/problems/tenant-not-found");
                return;
            }

            var isSuspended = string.Equals(
                institution.Status,
                nameof(InstitutionStatus.Suspended),
                StringComparison.OrdinalIgnoreCase);

            if (isSuspended && !path.StartsWith("/api/me", StringComparison.OrdinalIgnoreCase))
            {
                await WriteProblemAsync(
                    httpContext,
                    StatusCodes.Status423Locked,
                    "Institution Suspended",
                    $"La institución '{institution.Name}' se encuentra temporalmente suspendida.",
                    "https://knorooms.com/problems/tenant-suspended");
                return;
            }

            httpContext.Items[TenantInstitutionDtoItemKey] = institution;

            var initialTenantScope = new ExecutionScopeContext(
                TenantHostKind.Institution,
                TenantId: institution.Id,
                TenantSlug: institution.Slug,
                TenantName: institution.Name,
                IsTenantSuspended: isSuspended,
                UserId: authenticatedIdentity?.UserId,
                ExecutionMode: DatabaseExecutionMode.Tenant);

            using (tenantContextAccessor.BeginScope(initialTenantScope))
            {
                if (authenticatedIdentity is not null)
                {
                    var resolvedAccess = await tenantAuthorizationService.ResolveUserAccessInCurrentTenantAsync(
                        authenticatedIdentity.UserId,
                        authenticatedIdentity.IsPlatformSupport,
                        httpContext.RequestAborted);

                    httpContext.Items[TenantAccessHttpContextItemKey] = resolvedAccess;

                    var accessType = resolvedAccess.AccessType switch
                    {
                        nameof(TenantAccessType.Member) => TenantAccessType.Member,
                        nameof(TenantAccessType.Support) => TenantAccessType.Support,
                        _ => TenantAccessType.None
                    };

                    tenantContextAccessor.SetCurrent(initialTenantScope with
                    {
                        AccessType = accessType,
                        MembershipId = resolvedAccess.MembershipId,
                        SupportAccessGrantId = resolvedAccess.SupportAccessGrantId,
                        SupportAccessExpiresAtUtc = resolvedAccess.SupportAccessExpiresAtUtc
                    });
                }

                await next(httpContext);
            }

            return;
        }

        // Host público (p. ej. localhost:3000) — solo permite /api/me o endpoints públicos explícitos.
        using (tenantContextAccessor.BeginScope(new ExecutionScopeContext(
            TenantHostKind.Public,
            TenantId: null,
            TenantSlug: null,
            TenantName: null,
            IsTenantSuspended: false,
            UserId: authenticatedIdentity?.UserId,
            ExecutionMode: DatabaseExecutionMode.None)))
        {
            await next(httpContext);
        }
    }

    private static async Task WriteProblemAsync(
        HttpContext context,
        int statusCode,
        string title,
        string detail,
        string type)
    {
        context.Response.StatusCode = statusCode;
        context.Response.ContentType = "application/problem+json";

        var problem = new ProblemDetails
        {
            Status = statusCode,
            Title = title,
            Detail = detail,
            Type = type,
            Instance = context.Request.Path
        };
        problem.Extensions["traceId"] = context.TraceIdentifier;

        await context.Response.WriteAsJsonAsync(problem, cancellationToken: context.RequestAborted);
    }
}
