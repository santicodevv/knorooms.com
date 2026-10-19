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

    [Fact]
    public async Task AcademicStructure_VerticalSlice_EnforcesTenantIsolationAndBusinessRules()
    {
        await using var factory = new TestApiFactory(fixture.AppRoleConnectionString);
        using var client = factory.CreateClient();

        var suffix = Guid.NewGuid().ToString("N")[..6];
        var slugA = $"colegio-acad-a-{suffix}";
        var slugB = $"colegio-acad-b-{suffix}";

        var superAdminSub = $"superadmin-acad-{suffix}";
        var directorASub = $"director-acad-a-{suffix}";
        var teacherASub = $"teacher-acad-a-{suffix}";
        var directorBSub = $"director-acad-b-{suffix}";

        var superAdminEmail = $"admin-acad-{suffix}@knorooms.com";
        var directorAEmail = $"director@{slugA}.edu.do";
        var teacherAEmail = $"profesor.matematicas@{slugA}.edu.do";
        var directorBEmail = $"director@{slugB}.edu.do";

        foreach (var (sub, email, roles) in new[]
        {
            (superAdminSub, superAdminEmail, "PlatformAdmin"),
            (directorASub, directorAEmail, ""),
            (teacherASub, teacherAEmail, ""),
            (directorBSub, directorBEmail, "")
        })
        {
            using var meReq = CreateRequest(HttpMethod.Get, "/api/me", "localhost:3000", sub, email, roles);
            var meRes = await client.SendAsync(meReq);
            Assert.Equal(HttpStatusCode.OK, meRes.StatusCode);
        }

        InstitutionDto institutionA;
        InstitutionDto institutionB;

        using (var createAReq = CreateRequest(
            HttpMethod.Post,
            "/api/platform/institutions",
            "admin.localhost:3000",
            superAdminSub,
            superAdminEmail,
            "PlatformAdmin",
            new CreateInstitutionRequest(slugA, "Liceo Científico Duarte")))
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
            superAdminEmail,
            "PlatformAdmin",
            new CreateInstitutionRequest(slugB, "Colegio Politécnico Mella")))
        {
            var res = await client.SendAsync(createBReq);
            Assert.Equal(HttpStatusCode.Created, res.StatusCode);
            institutionB = (await res.Content.ReadFromJsonAsync<InstitutionDto>())!;
        }

        foreach (var (instId, email) in new[]
        {
            (institutionA.Id, directorAEmail),
            (institutionA.Id, teacherAEmail),
            (institutionB.Id, directorBEmail)
        })
        {
            using var assignReq = CreateRequest(
                HttpMethod.Post,
                $"/api/platform/institutions/{instId}/administrators",
                "admin.localhost:3000",
                superAdminSub,
                superAdminEmail,
                "PlatformAdmin",
                new AssignInstitutionAdministratorRequest(email));
            var res = await client.SendAsync(assignReq);
            Assert.Equal(HttpStatusCode.Created, res.StatusCode);
        }

        // Obtener el MembershipId del docente en Colegio A
        Guid teacherMembershipId;
        using (var membersReq = CreateRequest(
            HttpMethod.Get,
            "/api/tenant/members",
            $"{slugA}.localhost:3000",
            directorASub,
            directorAEmail))
        {
            var res = await client.SendAsync(membersReq);
            var members = (await res.Content.ReadFromJsonAsync<List<MemberDto>>())!;
            teacherMembershipId = members.Single(m => m.Email == teacherAEmail).MembershipId;
        }

        // 1. Crear Año Escolar 2026-2027 en Colegio A
        Knorooms.Modules.Modules.Academic.Contracts.AcademicYearDto yearA;
        using (var createYearReq = CreateRequest(
            HttpMethod.Post,
            "/api/tenant/academic/years",
            $"{slugA}.localhost:3000",
            directorASub,
            directorAEmail,
            body: new CreateAcademicYearRequest(
                "2026-2027",
                "Año Escolar 2026-2027",
                new DateOnly(2026, 8, 24),
                new DateOnly(2027, 6, 25))))
        {
            var res = await client.SendAsync(createYearReq);
            Assert.Equal(HttpStatusCode.Created, res.StatusCode);
            yearA = (await res.Content.ReadFromJsonAsync<Knorooms.Modules.Modules.Academic.Contracts.AcademicYearDto>())!;
            Assert.Equal("2026-2027", yearA.Code);
            Assert.False(yearA.IsClosed);
        }

        // 2. Crear Grado (4to de Secundaria) en Colegio A
        Knorooms.Modules.Modules.Academic.Contracts.GradeLevelDto gradeA;
        using (var createGradeReq = CreateRequest(
            HttpMethod.Post,
            "/api/tenant/academic/grade-levels",
            $"{slugA}.localhost:3000",
            directorASub,
            directorAEmail,
            body: new CreateGradeLevelRequest(
                "Secondary",
                10,
                "S4",
                "4.º de Secundaria (Modalidad Académica)")))
        {
            var res = await client.SendAsync(createGradeReq);
            Assert.Equal(HttpStatusCode.Created, res.StatusCode);
            gradeA = (await res.Content.ReadFromJsonAsync<Knorooms.Modules.Modules.Academic.Contracts.GradeLevelDto>())!;
            Assert.Equal("S4", gradeA.Code);
        }

        // 3. Crear Sección (Sección A - Matutina) en Colegio A
        Knorooms.Modules.Modules.Academic.Contracts.SchoolSectionDto sectionA;
        using (var createSectionReq = CreateRequest(
            HttpMethod.Post,
            "/api/tenant/academic/sections",
            $"{slugA}.localhost:3000",
            directorASub,
            directorAEmail,
            body: new CreateSchoolSectionRequest(
                yearA.Id,
                gradeA.Id,
                "A",
                "Morning",
                32)))
        {
            var res = await client.SendAsync(createSectionReq);
            Assert.Equal(HttpStatusCode.Created, res.StatusCode);
            sectionA = (await res.Content.ReadFromJsonAsync<Knorooms.Modules.Modules.Academic.Contracts.SchoolSectionDto>())!;
            Assert.Equal("A", sectionA.Code);
            Assert.Equal(32, sectionA.Capacity);
        }

        // 4. Crear Asignatura (Matemáticas) en Colegio A
        Knorooms.Modules.Modules.Academic.Contracts.SubjectDto subjectA;
        using (var createSubjectReq = CreateRequest(
            HttpMethod.Post,
            "/api/tenant/academic/subjects",
            $"{slugA}.localhost:3000",
            directorASub,
            directorAEmail,
            body: new CreateSubjectRequest("MAT-S4", "Matemáticas y Geometría Analítica")))
        {
            var res = await client.SendAsync(createSubjectReq);
            Assert.Equal(HttpStatusCode.Created, res.StatusCode);
            subjectA = (await res.Content.ReadFromJsonAsync<Knorooms.Modules.Modules.Academic.Contracts.SubjectDto>())!;
            Assert.Equal("MAT-S4", subjectA.Code);
        }

        // 5. Asignar Docente a Sección + Asignatura en Colegio A
        using (var assignTeacherReq = CreateRequest(
            HttpMethod.Post,
            "/api/tenant/academic/teacher-assignments",
            $"{slugA}.localhost:3000",
            directorASub,
            directorAEmail,
            body: new AssignTeacherRequest(sectionA.Id, subjectA.Id, teacherMembershipId, 6)))
        {
            var res = await client.SendAsync(assignTeacherReq);
            Assert.Equal(HttpStatusCode.Created, res.StatusCode);
            var assignment = (await res.Content.ReadFromJsonAsync<Knorooms.Modules.Modules.Academic.Contracts.TeacherAssignmentDto>())!;
            Assert.Equal(6, assignment.WeeklyHours);
            Assert.Equal(teacherAEmail, assignment.TeacherEmail);
        }

        // 6. Cerrar Año Escolar en Colegio A -> bloquea nuevas secciones (409 Conflict), luego reabrir
        using (var closeYearReq = CreateRequest(
            HttpMethod.Post,
            $"/api/tenant/academic/years/{yearA.Id}/close",
            $"{slugA}.localhost:3000",
            directorASub,
            directorAEmail))
        {
            var res = await client.SendAsync(closeYearReq);
            Assert.Equal(HttpStatusCode.NoContent, res.StatusCode);
        }

        using (var sectionOnClosedYearReq = CreateRequest(
            HttpMethod.Post,
            "/api/tenant/academic/sections",
            $"{slugA}.localhost:3000",
            directorASub,
            directorAEmail,
            body: new CreateSchoolSectionRequest(yearA.Id, gradeA.Id, "B", "Afternoon", 30)))
        {
            var res = await client.SendAsync(sectionOnClosedYearReq);
            Assert.Equal(HttpStatusCode.Conflict, res.StatusCode);
        }

        using (var reopenYearReq = CreateRequest(
            HttpMethod.Post,
            $"/api/tenant/academic/years/{yearA.Id}/reopen",
            $"{slugA}.localhost:3000",
            directorASub,
            directorAEmail))
        {
            var res = await client.SendAsync(reopenYearReq);
            Assert.Equal(HttpStatusCode.NoContent, res.StatusCode);
        }

        // 7. Consultar Overview en Colegio A -> contiene toda la estructura creada
        using (var overviewAReq = CreateRequest(
            HttpMethod.Get,
            "/api/tenant/academic/overview",
            $"{slugA}.localhost:3000",
            directorASub,
            directorAEmail))
        {
            var res = await client.SendAsync(overviewAReq);
            Assert.Equal(HttpStatusCode.OK, res.StatusCode);
            var overviewA = (await res.Content.ReadFromJsonAsync<Knorooms.Modules.Modules.Academic.Contracts.AcademicStructureOverviewDto>())!;
            Assert.Single(overviewA.AcademicYears);
            Assert.Single(overviewA.GradeLevels);
            Assert.Single(overviewA.Sections);
            Assert.Single(overviewA.Subjects);
            Assert.Single(overviewA.TeacherAssignments);
        }

        // 8. Aislamiento Multi-Tenant: Colegio B ve su estructura completamente vacía y no puede referenciar IDs de Colegio A
        using (var overviewBReq = CreateRequest(
            HttpMethod.Get,
            "/api/tenant/academic/overview",
            $"{slugB}.localhost:3000",
            directorBSub,
            directorBEmail))
        {
            var res = await client.SendAsync(overviewBReq);
            Assert.Equal(HttpStatusCode.OK, res.StatusCode);
            var overviewB = (await res.Content.ReadFromJsonAsync<Knorooms.Modules.Modules.Academic.Contracts.AcademicStructureOverviewDto>())!;
            Assert.Empty(overviewB.AcademicYears);
            Assert.Empty(overviewB.GradeLevels);
            Assert.Empty(overviewB.Sections);
            Assert.Empty(overviewB.Subjects);
            Assert.Empty(overviewB.TeacherAssignments);
        }

        using (var crossTenantSectionReq = CreateRequest(
            HttpMethod.Post,
            "/api/tenant/academic/sections",
            $"{slugB}.localhost:3000",
            directorBSub,
            directorBEmail,
            body: new CreateSchoolSectionRequest(yearA.Id, gradeA.Id, "A", "Morning", 25)))
        {
            var res = await client.SendAsync(crossTenantSectionReq);
            Assert.Equal(HttpStatusCode.NotFound, res.StatusCode);
        }
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
