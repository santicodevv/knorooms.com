using System.Net;
using System.Net.Http.Json;
using Knorooms.Api.Contracts;
using Knorooms.IntegrationTests.Infrastructure;
using Knorooms.Modules.Modules.Audit.Contracts;
using Knorooms.Modules.Modules.Authorization.Contracts;
using Knorooms.Modules.Modules.Identity.Contracts;
using Knorooms.Modules.Modules.Platform.Contracts;
using Knorooms.Modules.Modules.SupportAccess.Contracts;
using Knorooms.Modules.Modules.Tenants.Contracts;
using Knorooms.SharedKernel.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Knorooms.IntegrationTests.Api;

[Collection(PostgresDatabaseCollection.Name)]
public sealed class FoundationalVerticalSlicesIntegrationTests(PostgresIntegrationDatabaseFixture fixture)
{
    [Fact]
    public async Task DenyByDefault_And_ClientSuppliedTenantId_AreEnforced()
    {
        await using var factory = new TestApiFactory(fixture.AppRoleConnectionString);
        using var client = factory.CreateClient();

        // 1. Sondas de salud públicas responden 200 OK.
        var liveResponse = await client.GetAsync("/health/live");
        Assert.Equal(HttpStatusCode.OK, liveResponse.StatusCode);

        var readyResponse = await client.GetAsync("/health/ready");
        Assert.Equal(HttpStatusCode.OK, readyResponse.StatusCode);

        // 2. Denegación por defecto sin autenticación -> 401 Unauthorized.
        var unauthenticatedMe = await client.GetAsync("/api/me");
        Assert.Equal(HttpStatusCode.Unauthorized, unauthenticatedMe.StatusCode);

        // 3. Cliente intentando fijar X-Tenant-Id o ?tenantId= es rechazado con 400 Bad Request.
        using var tamperedHeaderReq = new HttpRequestMessage(HttpMethod.Get, "/api/me");
        tamperedHeaderReq.Headers.Add("X-Tenant-Id", Guid.NewGuid().ToString());
        var tamperedHeaderRes = await client.SendAsync(tamperedHeaderReq);
        Assert.Equal(HttpStatusCode.BadRequest, tamperedHeaderRes.StatusCode);

        var tamperedQueryRes = await client.GetAsync($"/api/me?tenantId={Guid.NewGuid()}");
        Assert.Equal(HttpStatusCode.BadRequest, tamperedQueryRes.StatusCode);
    }

    [Fact]
    public async Task EndToEnd_PlatformOnboarding_SubdomainIsolation_SupportAccess_And_Revocation()
    {
        await using var factory = new TestApiFactory(fixture.AppRoleConnectionString);
        using var client = factory.CreateClient();

        var suffix = Guid.NewGuid().ToString("N")[..6];
        var slugA = $"colegio-alpha-{suffix}";
        var slugB = $"colegio-beta-{suffix}";

        var superAdminSub = $"superadmin-{suffix}";
        var supportSub = $"support-{suffix}";
        var directorASub = $"director-a-{suffix}";
        var teacherASub = $"teacher-a-{suffix}";
        var directorBSub = $"director-b-{suffix}";

        var directorAEmail = $"director@{slugA}.edu.do";
        var teacherAEmail = $"profesor@{slugA}.edu.do";
        var directorBEmail = $"director@{slugB}.edu.do";

        // 1. Aprovisionamiento JIT: los usuarios inician sesión y consultan /api/me.
        foreach (var (sub, email, roles) in new[]
        {
            (superAdminSub, $"admin-{suffix}@knorooms.com", "PlatformAdmin"),
            (supportSub, $"soporte-{suffix}@knorooms.com", "PlatformSupport"),
            (directorASub, directorAEmail, ""),
            (teacherASub, teacherAEmail, ""),
            (directorBSub, directorBEmail, "")
        })
        {
            using var meReq = CreateRequest(HttpMethod.Get, "/api/me", "localhost:3000", sub, email, roles);
            var meRes = await client.SendAsync(meReq);
            Assert.Equal(HttpStatusCode.OK, meRes.StatusCode);
        }

        // 2. Usuario sin rol PlatformAdmin intenta crear una institución en admin.localhost -> 403 Forbidden.
        using (var forbiddenPlatformReq = CreateRequest(
            HttpMethod.Post,
            "/api/platform/institutions",
            "admin.localhost:3000",
            directorASub,
            directorAEmail,
            roles: "",
            body: new CreateInstitutionRequest(slugA, "Colegio Alpha")))
        {
            var res = await client.SendAsync(forbiddenPlatformReq);
            Assert.Equal(HttpStatusCode.Forbidden, res.StatusCode);
        }

        // 3. SuperAdmin crea Colegio Alpha y Colegio Beta en admin.localhost y asigna sus administradores iniciales.
        InstitutionDto institutionA;
        InstitutionDto institutionB;

        using (var createAReq = CreateRequest(
            HttpMethod.Post,
            "/api/platform/institutions",
            "admin.localhost:3000",
            superAdminSub,
            $"admin-{suffix}@knorooms.com",
            "PlatformAdmin",
            new CreateInstitutionRequest(slugA, "Colegio Alpha RD")))
        {
            var res = await client.SendAsync(createAReq);
            Assert.Equal(HttpStatusCode.Created, res.StatusCode);
            institutionA = (await res.Content.ReadFromJsonAsync<InstitutionDto>())!;
        }

        using (var createBReq = CreateRequest(
            HttpMethod.Post,
            "/api/platform/institutions",
            "admin.localhost:3000",
            superAdminSub,
            $"admin-{suffix}@knorooms.com",
            "PlatformAdmin",
            new CreateInstitutionRequest(slugB, "Colegio Beta RD")))
        {
            var res = await client.SendAsync(createBReq);
            Assert.Equal(HttpStatusCode.Created, res.StatusCode);
            institutionB = (await res.Content.ReadFromJsonAsync<InstitutionDto>())!;
        }

        using (var assignAdminAReq = CreateRequest(
            HttpMethod.Post,
            $"/api/platform/institutions/{institutionA.Id}/administrators",
            "admin.localhost:3000",
            superAdminSub,
            $"admin-{suffix}@knorooms.com",
            "PlatformAdmin",
            new AssignInstitutionAdministratorRequest(directorAEmail)))
        {
            var res = await client.SendAsync(assignAdminAReq);
            Assert.Equal(HttpStatusCode.Created, res.StatusCode);
        }

        using (var assignSecondMemberAReq = CreateRequest(
            HttpMethod.Post,
            $"/api/platform/institutions/{institutionA.Id}/administrators",
            "admin.localhost:3000",
            superAdminSub,
            $"admin-{suffix}@knorooms.com",
            "PlatformAdmin",
            new AssignInstitutionAdministratorRequest(teacherAEmail)))
        {
            var res = await client.SendAsync(assignSecondMemberAReq);
            Assert.Equal(HttpStatusCode.Created, res.StatusCode);
        }

        using (var assignAdminBReq = CreateRequest(
            HttpMethod.Post,
            $"/api/platform/institutions/{institutionB.Id}/administrators",
            "admin.localhost:3000",
            superAdminSub,
            $"admin-{suffix}@knorooms.com",
            "PlatformAdmin",
            new AssignInstitutionAdministratorRequest(directorBEmail)))
        {
            var res = await client.SendAsync(assignAdminBReq);
            Assert.Equal(HttpStatusCode.Created, res.StatusCode);
        }

        // 4. Director A accede a su propio subdominio (colegio-alpha) -> 200 OK.
        using (var ctxAReq = CreateRequest(
            HttpMethod.Get,
            "/api/tenant/context",
            $"{slugA}.localhost:3000",
            directorASub,
            directorAEmail))
        {
            var res = await client.SendAsync(ctxAReq);
            Assert.Equal(HttpStatusCode.OK, res.StatusCode);
            var ctx = await res.Content.ReadFromJsonAsync<TenantAccessContextDto>();
            Assert.NotNull(ctx);
            Assert.Equal(institutionA.Id, ctx.Tenant.Id);
            Assert.Equal("Member", ctx.AccessType);
            Assert.Contains(PermissionCatalog.InstitutionMembersManage, ctx.Permissions);
        }

        // 5. Director A intenta acceder al subdominio de Colegio Beta -> 403 Forbidden (el subdominio NO autoriza).
        using (var crossTenantReq = CreateRequest(
            HttpMethod.Get,
            "/api/tenant/context",
            $"{slugB}.localhost:3000",
            directorASub,
            directorAEmail))
        {
            var res = await client.SendAsync(crossTenantReq);
            Assert.Equal(HttpStatusCode.Forbidden, res.StatusCode);
        }

        // 6. SuperAdmin tampoco tiene acceso automático al portal institucional sin membresía -> 403 Forbidden.
        using (var superAdminToTenantReq = CreateRequest(
            HttpMethod.Get,
            "/api/tenant/members",
            $"{slugA}.localhost:3000",
            superAdminSub,
            $"admin-{suffix}@knorooms.com",
            "PlatformAdmin"))
        {
            var res = await client.SendAsync(superAdminToTenantReq);
            Assert.Equal(HttpStatusCode.Forbidden, res.StatusCode);
        }

        // 7. Flujo completo de acceso temporal de Soporte Técnico:
        // 7a. Antes de solicitar/aprobar, soporte recibe 403 en el colegio.
        using (var supportBeforeReq = CreateRequest(
            HttpMethod.Get,
            "/api/tenant/context",
            $"{slugA}.localhost:3000",
            supportSub,
            $"soporte-{suffix}@knorooms.com",
            "PlatformSupport"))
        {
            var res = await client.SendAsync(supportBeforeReq);
            Assert.Equal(HttpStatusCode.Forbidden, res.StatusCode);
        }

        // 7b. Soporte solicita acceso temporal desde admin.localhost.
        SupportAccessGrantDto supportGrant;
        using (var requestGrantReq = CreateRequest(
            HttpMethod.Post,
            "/api/platform/support-access-requests",
            "admin.localhost:3000",
            supportSub,
            $"soporte-{suffix}@knorooms.com",
            "PlatformSupport",
            new CreateSupportAccessRequest(
                institutionA.Id,
                "Incidencia #402: verificación de configuración de miembros del colegio",
                [PermissionCatalog.InstitutionMembersRead],
                DurationMinutes: 60)))
        {
            var res = await client.SendAsync(requestGrantReq);
            Assert.Equal(HttpStatusCode.Created, res.StatusCode);
            supportGrant = (await res.Content.ReadFromJsonAsync<SupportAccessGrantDto>())!;
            Assert.Equal("Requested", supportGrant.Status);
        }

        // 7c. Aún no aprobado por el colegio -> sigue dando 403.
        using (var supportPendingReq = CreateRequest(
            HttpMethod.Get,
            "/api/tenant/members",
            $"{slugA}.localhost:3000",
            supportSub,
            $"soporte-{suffix}@knorooms.com",
            "PlatformSupport"))
        {
            var res = await client.SendAsync(supportPendingReq);
            Assert.Equal(HttpStatusCode.Forbidden, res.StatusCode);
        }

        // 7d. Director A aprueba la solicitud de soporte desde su colegio.
        using (var approveGrantReq = CreateRequest(
            HttpMethod.Post,
            $"/api/tenant/support-access/{supportGrant.Id}/approve",
            $"{slugA}.localhost:3000",
            directorASub,
            directorAEmail))
        {
            var res = await client.SendAsync(approveGrantReq);
            Assert.Equal(HttpStatusCode.NoContent, res.StatusCode);
        }

        // 7e. Ahora soporte puede leer miembros en Colegio Alpha (200 OK), pero NO revocar miembros (403 Forbidden por permisos limitados).
        using (var supportReadMembersReq = CreateRequest(
            HttpMethod.Get,
            "/api/tenant/members",
            $"{slugA}.localhost:3000",
            supportSub,
            $"soporte-{suffix}@knorooms.com",
            "PlatformSupport"))
        {
            var res = await client.SendAsync(supportReadMembersReq);
            Assert.Equal(HttpStatusCode.OK, res.StatusCode);
        }

        // 7f. Director A revoca el acceso temporal de soporte -> soporte pierde acceso de inmediato (403 Forbidden).
        using (var revokeGrantReq = CreateRequest(
            HttpMethod.Post,
            $"/api/tenant/support-access/{supportGrant.Id}/revoke",
            $"{slugA}.localhost:3000",
            directorASub,
            directorAEmail))
        {
            var res = await client.SendAsync(revokeGrantReq);
            Assert.Equal(HttpStatusCode.NoContent, res.StatusCode);
        }

        using (var supportAfterRevokeReq = CreateRequest(
            HttpMethod.Get,
            "/api/tenant/members",
            $"{slugA}.localhost:3000",
            supportSub,
            $"soporte-{suffix}@knorooms.com",
            "PlatformSupport"))
        {
            var res = await client.SendAsync(supportAfterRevokeReq);
            Assert.Equal(HttpStatusCode.Forbidden, res.StatusCode);
        }

        // 8. Revocación de membresía institucional: Director A revoca al segundo miembro -> pierde acceso inmediatamente.
        Guid secondMembershipId;
        using (var listMembersReq = CreateRequest(
            HttpMethod.Get,
            "/api/tenant/members",
            $"{slugA}.localhost:3000",
            directorASub,
            directorAEmail))
        {
            var res = await client.SendAsync(listMembersReq);
            var members = (await res.Content.ReadFromJsonAsync<List<MemberDto>>())!;
            secondMembershipId = members.Single(m => m.Email == teacherAEmail).MembershipId;
        }

        using (var revokeMemberReq = CreateRequest(
            HttpMethod.Post,
            $"/api/tenant/members/{secondMembershipId}/revoke",
            $"{slugA}.localhost:3000",
            directorASub,
            directorAEmail))
        {
            var res = await client.SendAsync(revokeMemberReq);
            Assert.Equal(HttpStatusCode.NoContent, res.StatusCode);
        }

        using (var revokedUserReq = CreateRequest(
            HttpMethod.Get,
            "/api/tenant/context",
            $"{slugA}.localhost:3000",
            teacherASub,
            teacherAEmail))
        {
            var res = await client.SendAsync(revokedUserReq);
            Assert.Equal(HttpStatusCode.Forbidden, res.StatusCode);
        }

        // 8b. Auditoría institucional y global registran las operaciones sensibles sin fugas entre colegios.
        using (var tenantAuditReq = CreateRequest(
            HttpMethod.Get,
            "/api/tenant/audit-logs",
            $"{slugA}.localhost:3000",
            directorASub,
            directorAEmail))
        {
            var res = await client.SendAsync(tenantAuditReq);
            Assert.Equal(HttpStatusCode.OK, res.StatusCode);
            var tenantLogs = (await res.Content.ReadFromJsonAsync<List<AuditLogEntryDto>>())!;
            Assert.NotEmpty(tenantLogs);
            Assert.All(tenantLogs, log => Assert.Equal(institutionA.Id, log.TenantId));
            Assert.Contains(tenantLogs, log => log.Action == "support_access.approved");
            Assert.Contains(tenantLogs, log => log.Action == "support_access.revoked");
        }

        using (var platformAuditReq = CreateRequest(
            HttpMethod.Get,
            "/api/platform/audit-logs",
            "admin.localhost:3000",
            superAdminSub,
            $"admin-{suffix}@knorooms.com",
            "PlatformAdmin"))
        {
            var res = await client.SendAsync(platformAuditReq);
            Assert.Equal(HttpStatusCode.OK, res.StatusCode);
            var platformLogs = (await res.Content.ReadFromJsonAsync<List<AuditLogEntryDto>>())!;
            Assert.NotEmpty(platformLogs);
        }

        // 9. Suspensión de institución -> el portal institucional responde 423 Locked.
        using (var suspendReq = CreateRequest(
            HttpMethod.Post,
            $"/api/platform/institutions/{institutionA.Id}/suspend",
            "admin.localhost:3000",
            superAdminSub,
            $"admin-{suffix}@knorooms.com",
            "PlatformAdmin"))
        {
            var res = await client.SendAsync(suspendReq);
            Assert.Equal(HttpStatusCode.NoContent, res.StatusCode);
        }

        using (var suspendedTenantReq = CreateRequest(
            HttpMethod.Get,
            "/api/tenant/context",
            $"{slugA}.localhost:3000",
            directorASub,
            directorAEmail))
        {
            var res = await client.SendAsync(suspendedTenantReq);
            Assert.Equal((HttpStatusCode)423, res.StatusCode);
        }
    }

    [Fact]
    public async Task MfaPolicy_WhenEnabled_RequiresMfaClaimForPrivilegedRoles()
    {
        await using var factory = new TestApiFactory(fixture.AppRoleConnectionString, enforceMfa: true);
        using var client = factory.CreateClient();

        // Sin claim MFA -> 403 con type .../mfa-required
        using var noMfaReq = CreateRequest(
            HttpMethod.Get,
            "/api/platform/institutions",
            "admin.localhost:3000",
            "mfa-admin-sub",
            "mfa-admin@knorooms.com",
            roles: "PlatformAdmin",
            amr: null);

        var noMfaRes = await client.SendAsync(noMfaReq);
        Assert.Equal(HttpStatusCode.Forbidden, noMfaRes.StatusCode);
        var problem = await noMfaRes.Content.ReadFromJsonAsync<ProblemDetails>();
        Assert.NotNull(problem);
        Assert.EndsWith("/mfa-required", problem.Type, StringComparison.Ordinal);

        // Con claim amr=mfa -> 200 OK
        using var withMfaReq = CreateRequest(
            HttpMethod.Get,
            "/api/platform/institutions",
            "admin.localhost:3000",
            "mfa-admin-sub",
            "mfa-admin@knorooms.com",
            roles: "PlatformAdmin",
            amr: "mfa");

        var withMfaRes = await client.SendAsync(withMfaReq);
        Assert.Equal(HttpStatusCode.OK, withMfaRes.StatusCode);
    }

    private static HttpRequestMessage CreateRequest(
        HttpMethod method,
        string path,
        string forwardedHost,
        string sub,
        string email,
        string roles = "",
        object? body = null,
        string? amr = null)
    {
        var req = new HttpRequestMessage(method, path);
        req.Headers.Add("X-Forwarded-Host", forwardedHost);
        req.Headers.Add(TestOidcAuthHandler.SubjectHeader, sub);
        req.Headers.Add(TestOidcAuthHandler.EmailHeader, email);

        if (!string.IsNullOrWhiteSpace(roles))
        {
            req.Headers.Add(TestOidcAuthHandler.RolesHeader, roles);
        }

        if (!string.IsNullOrWhiteSpace(amr))
        {
            req.Headers.Add(TestOidcAuthHandler.MfaHeader, amr);
        }

        if (body is not null)
        {
            req.Content = JsonContent.Create(body);
        }

        return req;
    }
}
