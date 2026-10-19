using Knorooms.Modules.Modules.Audit.Domain;
using Knorooms.Modules.Modules.Authorization.Domain;
using Knorooms.Modules.Modules.Grading.Domain;
using Knorooms.Modules.Modules.ReportCards.Domain;
using Knorooms.Modules.Modules.SupportAccess.Domain;
using Knorooms.SharedKernel.Authorization;

namespace Knorooms.UnitTests.Domain;

public sealed class FoundationalDomainRulesTests
{
    [Fact]
    public void InstitutionRole_Create_WithPlatformPermission_IsForbidden()
    {
        var tenantId = Guid.CreateVersion7();

        var result = InstitutionRole.Create(
            tenantId,
            "CustomAdmin",
            "Rol malicioso",
            "Intenta escalar a plataforma",
            isSystemRole: false,
            [PermissionCatalog.InstitutionMembersRead, PermissionCatalog.PlatformInstitutionsManage]);

        Assert.True(result.IsFailure);
        Assert.Equal("Role.PlatformPermissionForbidden", result.Error.Code);
    }

    [Fact]
    public void TenantMembership_Create_WithRoleFromAnotherTenant_IsRejected()
    {
        var tenantA = Guid.CreateVersion7();
        var tenantB = Guid.CreateVersion7();
        var roleInTenantB = InstitutionRole.Create(
            tenantB,
            "Teacher",
            "Docente",
            "Docente B",
            isSystemRole: true,
            [PermissionCatalog.InstitutionStudentsRead]).Value;

        var membershipResult = TenantMembership.Create(
            tenantA,
            Guid.CreateVersion7(),
            [roleInTenantB]);

        Assert.True(membershipResult.IsFailure);
        Assert.Equal("Membership.CrossTenantRoleDenied", membershipResult.Error.Code);
    }

    [Fact]
    public void SupportAccessGrant_Request_ProhibitsGradingApprovalAndReportCardPublication()
    {
        var tenantId = Guid.CreateVersion7();
        var requesterId = Guid.CreateVersion7();

        var forbiddenResult = SupportAccessGrant.Request(
            tenantId,
            requesterId,
            "Revisión de incidencia reportada en boletín",
            [PermissionCatalog.InstitutionGradingApprove],
            durationMinutes: 60);

        Assert.True(forbiddenResult.IsFailure);
        Assert.Equal("SupportAccess.ProhibitedPermission", forbiddenResult.Error.Code);
    }

    [Fact]
    public void SupportAccessGrant_Lifecycle_EnforcesApprovalExpirationAndRevocation()
    {
        var tenantId = Guid.CreateVersion7();
        var supportUserId = Guid.CreateVersion7();
        var adminUserId = Guid.CreateVersion7();
        var now = DateTimeOffset.UtcNow;

        var grant = SupportAccessGrant.Request(
            tenantId,
            supportUserId,
            "Soporte autorizado para verificar listado de miembros",
            [PermissionCatalog.InstitutionMembersRead],
            durationMinutes: 120).Value;

        Assert.False(grant.IsCurrentlyActive(now));

        var approveResult = grant.Approve(adminUserId, now);
        Assert.True(approveResult.IsSuccess);
        Assert.True(grant.IsCurrentlyActive(now.AddMinutes(30)));
        Assert.False(grant.IsCurrentlyActive(now.AddMinutes(121)));

        var revokeResult = grant.Revoke(adminUserId, now.AddMinutes(40));
        Assert.True(revokeResult.IsSuccess);
        Assert.False(grant.IsCurrentlyActive(now.AddMinutes(45)));
    }

    [Fact]
    public void GradeEntry_Approve_EnforcesSeparationOfDuties()
    {
        var tenantId = Guid.CreateVersion7();
        var teacherMembershipId = Guid.CreateVersion7();
        var coordinatorMembershipId = Guid.CreateVersion7();

        var entry = GradeEntry.RecordDraft(
            tenantId,
            Guid.CreateVersion7(),
            Guid.CreateVersion7(),
            Guid.CreateVersion7(),
            "P1",
            88.5m,
            teacherMembershipId).Value;

        var selfApprove = entry.Approve(teacherMembershipId);
        Assert.True(selfApprove.IsFailure);
        Assert.Equal("GradeEntry.SeparationOfDutiesViolation", selfApprove.Error.Code);

        var coordinatorApprove = entry.Approve(coordinatorMembershipId);
        Assert.True(coordinatorApprove.IsSuccess);
        Assert.Equal(GradeWorkflowStatus.Approved, entry.Status);
    }

    [Fact]
    public void ReportCardSnapshot_CreateCorrectedVersion_PreservesPreviousVersionAndRequiresReason()
    {
        var tenantId = Guid.CreateVersion7();
        var initial = ReportCardSnapshot.PublishInitial(
            tenantId,
            Guid.CreateVersion7(),
            Guid.CreateVersion7(),
            "P1",
            "{\"average\":85}",
            Guid.CreateVersion7()).Value;

        var missingReason = initial.CreateCorrectedVersion("{\"average\":90}", Guid.CreateVersion7(), "corto");
        Assert.True(missingReason.IsFailure);

        var corrected = initial.CreateCorrectedVersion(
            "{\"average\":90}",
            Guid.CreateVersion7(),
            "Rectificación autorizada por acta de revisión académica #102").Value;

        Assert.Equal(1, initial.VersionNumber);
        Assert.Equal("{\"average\":85}", initial.ImmutablePayloadJson);
        Assert.Equal(2, corrected.VersionNumber);
        Assert.Equal(initial.Id, corrected.SupersedesSnapshotId);
    }

    [Fact]
    public void AuditLogEntry_Create_RedactsSensitiveMetadataKeys()
    {
        var entry = AuditLogEntry.Create(
            tenantId: Guid.CreateVersion7(),
            actorUserId: Guid.CreateVersion7(),
            actorAccessType: "Member",
            supportAccessGrantId: null,
            action: "test.action",
            resourceType: "User",
            resourceId: "123",
            summary: "Prueba de sanitización",
            metadata: new Dictionary<string, string?>
            {
                ["email"] = "usuario@colegio.edu.do",
                ["accessToken"] = "eyJhbGciOi...",
                ["client_secret"] = "top-secret-value",
                ["passwordHash"] = "hash"
            });

        Assert.Contains("usuario@colegio.edu.do", entry.MetadataJson, StringComparison.Ordinal);
        Assert.DoesNotContain("eyJhbGciOi", entry.MetadataJson, StringComparison.Ordinal);
        Assert.DoesNotContain("top-secret-value", entry.MetadataJson, StringComparison.Ordinal);
        Assert.Contains("[REDACTED]", entry.MetadataJson, StringComparison.Ordinal);
    }
}
