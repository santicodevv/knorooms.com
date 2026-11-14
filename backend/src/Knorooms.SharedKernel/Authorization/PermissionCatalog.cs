namespace Knorooms.SharedKernel.Authorization;

public enum PermissionScope
{
    Platform = 1,
    Institution = 2
}

public sealed record PermissionDefinition(
    string Code,
    string Name,
    string Description,
    PermissionScope Scope,
    string Module);

/// <summary>
/// Catálogo central e inmutable de permisos del sistema KNOROOMS (RBAC + ABAC).
/// Separa estrictamente permisos de plataforma global y permisos institucionales por colegio.
/// </summary>
public static class PermissionCatalog
{
    // Permisos de plataforma global (KNOROOMS)
    public const string PlatformInstitutionsRead = "platform.institutions.read";
    public const string PlatformInstitutionsManage = "platform.institutions.manage";
    public const string PlatformSupportRequestAccess = "platform.support.request-access";
    public const string PlatformAuditRead = "platform.audit.read";

    // Permisos institucionales (por colegio)
    public const string InstitutionContextRead = "institution.context.read";
    public const string InstitutionMembersRead = "institution.members.read";
    public const string InstitutionMembersManage = "institution.members.manage";
    public const string InstitutionRolesRead = "institution.roles.read";
    public const string InstitutionRolesManage = "institution.roles.manage";
    public const string InstitutionSupportAccessRead = "institution.support-access.read";
    public const string InstitutionSupportAccessManage = "institution.support-access.manage";
    public const string InstitutionAuditRead = "institution.audit.read";
    public const string InstitutionStudentsRead = "institution.students.read";
    public const string InstitutionStudentsManage = "institution.students.manage";
    public const string InstitutionAcademicRead = "institution.academic.read";
    public const string InstitutionAcademicManage = "institution.academic.manage";
    public const string InstitutionEnrollmentsRead = "institution.enrollments.read";
    public const string InstitutionEnrollmentsManage = "institution.enrollments.manage";
    public const string InstitutionAttendanceRead = "institution.attendance.read";
    public const string InstitutionAttendanceRecord = "institution.attendance.record";
    public const string InstitutionGradingRead = "institution.grading.read";
    public const string InstitutionGradingRecord = "institution.grading.record";
    public const string InstitutionGradingApprove = "institution.grading.approve";
    public const string InstitutionReportCardsRead = "institution.report-cards.read";
    public const string InstitutionReportCardsPublish = "institution.report-cards.publish";

    public const string InstitutionStudentsCreate = "institution.students.create";
    public const string InstitutionStudentsUpdate = "institution.students.update";
    public const string InstitutionStudentsDeactivate = "institution.students.deactivate";
    public const string InstitutionStudentsMedicalRead = "institution.students.medical.read";
    public const string InstitutionGuardiansManage = "institution.guardians.manage";
    public const string InstitutionDocumentsRead = "institution.documents.read";
    public const string InstitutionDocumentsManage = "institution.documents.manage";
    public const string InstitutionDocumentTypesManage = "institution.document-types.manage";
    public const string InstitutionImportsRun = "institution.imports.run";
    public const string InstitutionGradingCorrect = "institution.grading.correct";
    public const string InstitutionReportCardsRectify = "institution.report-cards.rectify";
    public const string InstitutionReportCardsExport = "institution.report-cards.export";
    public const string InstitutionReportsRead = "institution.reports.read";

    public static readonly IReadOnlyList<PermissionDefinition> All =
    [
        new(PlatformInstitutionsRead, "Consultar instituciones", "Permite listar y consultar colegios registrados en la plataforma.", PermissionScope.Platform, "Tenants"),
        new(PlatformInstitutionsManage, "Administrar instituciones", "Permite dar de alta, suspender, reactivar colegios y asignar su administrador inicial.", PermissionScope.Platform, "Tenants"),
        new(PlatformSupportRequestAccess, "Solicitar acceso temporal de soporte", "Permite a soporte solicitar acceso temporal y auditado a una institución.", PermissionScope.Platform, "SupportAccess"),
        new(PlatformAuditRead, "Consultar auditoría global", "Permite consultar eventos de auditoría de plataforma.", PermissionScope.Platform, "Audit"),

        new(InstitutionContextRead, "Consultar contexto institucional", "Permite consultar la identidad y configuración básica del colegio activo.", PermissionScope.Institution, "Tenants"),
        new(InstitutionMembersRead, "Consultar miembros del colegio", "Permite listar miembros y roles dentro del colegio.", PermissionScope.Institution, "Authorization"),
        new(InstitutionMembersManage, "Administrar miembros del colegio", "Permite invitar, asignar roles y revocar membresías dentro del colegio.", PermissionScope.Institution, "Authorization"),
        new(InstitutionRolesRead, "Consultar roles del colegio", "Permite consultar los roles predefinidos y personalizados del colegio.", PermissionScope.Institution, "Authorization"),
        new(InstitutionRolesManage, "Administrar roles del colegio", "Permite ajustar los permisos de los roles del colegio.", PermissionScope.Institution, "Authorization"),
        new(InstitutionSupportAccessRead, "Consultar solicitudes de soporte", "Permite ver solicitudes y sesiones de soporte temporal del colegio.", PermissionScope.Institution, "SupportAccess"),
        new(InstitutionSupportAccessManage, "Aprobar o revocar acceso de soporte", "Permite autorizar, rechazar o revocar inmediatamente el acceso temporal de soporte.", PermissionScope.Institution, "SupportAccess"),
        new(InstitutionAuditRead, "Consultar auditoría institucional", "Permite consultar la bitácora de auditoría del colegio.", PermissionScope.Institution, "Audit"),

        new(InstitutionStudentsRead, "Consultar expedientes estudiantiles", "Permite consultar estudiantes y responsables autorizados.", PermissionScope.Institution, "Students"),
        new(InstitutionStudentsManage, "Gestionar expedientes estudiantiles", "Permite registrar y actualizar expedientes estudiantiles y vínculos familiares.", PermissionScope.Institution, "Students"),
        new(InstitutionAcademicRead, "Consultar organización académica", "Permite consultar años escolares, grados, secciones y asignaturas.", PermissionScope.Institution, "Academic"),
        new(InstitutionAcademicManage, "Gestionar organización académica", "Permite configurar años escolares, grados, secciones, asignaturas y cargas docentes.", PermissionScope.Institution, "Academic"),
        new(InstitutionEnrollmentsRead, "Consultar matrículas", "Permite consultar matrículas por año escolar y sección.", PermissionScope.Institution, "Enrollments"),
        new(InstitutionEnrollmentsManage, "Gestionar matrículas", "Permite matricular, trasladar o retirar estudiantes en un año escolar.", PermissionScope.Institution, "Enrollments"),
        new(InstitutionAttendanceRead, "Consultar asistencia", "Permite consultar registros de asistencia escolar.", PermissionScope.Institution, "Attendance"),
        new(InstitutionAttendanceRecord, "Registrar asistencia", "Permite registrar presencia, ausencia, tardanza y justificaciones.", PermissionScope.Institution, "Attendance"),
        new(InstitutionGradingRead, "Consultar calificaciones", "Permite consultar evaluaciones y calificaciones.", PermissionScope.Institution, "Grading"),
        new(InstitutionGradingRecord, "Registrar calificaciones", "Permite al docente registrar calificaciones en sus secciones asignadas.", PermissionScope.Institution, "Grading"),
        new(InstitutionGradingApprove, "Aprobar y cerrar calificaciones", "Permite a coordinación/dirección revisar y aprobar cierres de evaluación.", PermissionScope.Institution, "Grading"),
        new(InstitutionReportCardsRead, "Consultar boletines", "Permite consultar boletines publicados.", PermissionScope.Institution, "ReportCards"),
        new(InstitutionReportCardsPublish, "Publicar boletines", "Permite emitir versiones históricas inmutables de boletines.", PermissionScope.Institution, "ReportCards"),
        new(InstitutionStudentsCreate, "Registrar estudiantes", "Permite registrar estudiantes en el colegio activo.", PermissionScope.Institution, "Students"),
        new(InstitutionStudentsUpdate, "Editar estudiantes", "Permite editar estudiantes en el colegio activo.", PermissionScope.Institution, "Students"),
        new(InstitutionStudentsDeactivate, "Desactivar estudiantes", "Permite desactivar estudiantes en el colegio activo.", PermissionScope.Institution, "Students"),
        new(InstitutionStudentsMedicalRead, "Consultar datos médicos", "Permite consultar datos médicos en el colegio activo.", PermissionScope.Institution, "Students"),
        new(InstitutionGuardiansManage, "Gestionar responsables", "Permite gestionar responsables en el colegio activo.", PermissionScope.Institution, "Students"),
        new(InstitutionDocumentsRead, "Consultar documentos", "Permite consultar documentos en el colegio activo.", PermissionScope.Institution, "Documents"),
        new(InstitutionDocumentsManage, "Gestionar documentos", "Permite gestionar documentos en el colegio activo.", PermissionScope.Institution, "Documents"),
        new(InstitutionDocumentTypesManage, "Gestionar tipos de documento", "Permite gestionar tipos de documento en el colegio activo.", PermissionScope.Institution, "Documents"),
        new(InstitutionImportsRun, "Ejecutar importaciones", "Permite ejecutar importaciones en el colegio activo.", PermissionScope.Institution, "Integrations"),
        new(InstitutionGradingCorrect, "Rectificar calificaciones", "Permite rectificar calificaciones en el colegio activo.", PermissionScope.Institution, "Grading"),
        new(InstitutionReportCardsRectify, "Rectificar boletines", "Permite rectificar boletines en el colegio activo.", PermissionScope.Institution, "ReportCards"),
        new(InstitutionReportCardsExport, "Exportar boletines", "Permite exportar boletines en el colegio activo.", PermissionScope.Institution, "ReportCards"),
        new(InstitutionReportsRead, "Consultar reportes", "Permite consultar reportes en el colegio activo.", PermissionScope.Institution, "Reports")
    ];

    private static readonly Dictionary<string, PermissionDefinition> ByCode =
        All.ToDictionary(p => p.Code, StringComparer.Ordinal);

    public static bool TryGet(string code, out PermissionDefinition? definition) =>
        ByCode.TryGetValue(code, out definition);

    public static bool IsInstitutionScoped(string code) =>
        ByCode.TryGetValue(code, out var def) && def.Scope == PermissionScope.Institution;

    public static bool IsPlatformScoped(string code) =>
        ByCode.TryGetValue(code, out var def) && def.Scope == PermissionScope.Platform;
}

public static class SystemRoleCatalog
{
    // Roles globales (usuario de plataforma)
    public const string PlatformSuperAdmin = "PlatformAdmin";
    public const string PlatformSupportAgent = "PlatformSupport";

    // Roles predefinidos por institución (plantillas iniciales)
    public const string InstitutionAdmin = "InstitutionAdmin";
    public const string Principal = "Principal";
    public const string AcademicCoordinator = "AcademicCoordinator";
    public const string Registrar = "Registrar";
    public const string Teacher = "Teacher";
    public const string Guardian = "Guardian";

    public static readonly IReadOnlyDictionary<string, (string Name, string Description, string[] Permissions)> InstitutionRoleTemplates =
        new Dictionary<string, (string Name, string Description, string[] Permissions)>(StringComparer.Ordinal)
        {
            [InstitutionAdmin] = (
                "Administrador institucional",
                "Configura el colegio, gestiona usuarios, roles y aprueba accesos temporales de soporte.",
                AllInstitutionPermissions()),
            [Principal] = (
                "Dirección académica",
                "Supervisa la operación académica, aprueba cierres de calificaciones, publica boletines y autoriza soporte.",
                [
                    PermissionCatalog.InstitutionGradingCorrect,
                    PermissionCatalog.InstitutionReportCardsRectify,
                    PermissionCatalog.InstitutionReportCardsExport,
                    PermissionCatalog.InstitutionReportsRead,
                    PermissionCatalog.InstitutionContextRead,
                    PermissionCatalog.InstitutionMembersRead,
                    PermissionCatalog.InstitutionRolesRead,
                    PermissionCatalog.InstitutionSupportAccessRead,
                    PermissionCatalog.InstitutionSupportAccessManage,
                    PermissionCatalog.InstitutionAuditRead,
                    PermissionCatalog.InstitutionStudentsRead,
                    PermissionCatalog.InstitutionAcademicRead,
                    PermissionCatalog.InstitutionAcademicManage,
                    PermissionCatalog.InstitutionEnrollmentsRead,
                    PermissionCatalog.InstitutionAttendanceRead,
                    PermissionCatalog.InstitutionGradingRead,
                    PermissionCatalog.InstitutionGradingApprove,
                    PermissionCatalog.InstitutionReportCardsRead,
                    PermissionCatalog.InstitutionReportCardsPublish
                ]),
            [AcademicCoordinator] = (
                "Coordinación académica",
                "Organiza grados, secciones y docentes; supervisa asistencia y evaluaciones.",
                [
                    PermissionCatalog.InstitutionGradingCorrect,
                    PermissionCatalog.InstitutionReportCardsExport,
                    PermissionCatalog.InstitutionReportsRead,
                    PermissionCatalog.InstitutionContextRead,
                    PermissionCatalog.InstitutionStudentsRead,
                    PermissionCatalog.InstitutionAcademicRead,
                    PermissionCatalog.InstitutionAcademicManage,
                    PermissionCatalog.InstitutionEnrollmentsRead,
                    PermissionCatalog.InstitutionAttendanceRead,
                    PermissionCatalog.InstitutionGradingRead,
                    PermissionCatalog.InstitutionGradingApprove,
                    PermissionCatalog.InstitutionReportCardsRead
                ]),
            [Registrar] = (
                "Secretaría y registro",
                "Gestiona expedientes permanentes, responsables y matrículas por año escolar.",
                [
                    PermissionCatalog.InstitutionStudentsCreate,
                    PermissionCatalog.InstitutionStudentsUpdate,
                    PermissionCatalog.InstitutionStudentsDeactivate,
                    PermissionCatalog.InstitutionGuardiansManage,
                    PermissionCatalog.InstitutionDocumentsRead,
                    PermissionCatalog.InstitutionDocumentsManage,
                    PermissionCatalog.InstitutionReportCardsExport,
                    PermissionCatalog.InstitutionContextRead,
                    PermissionCatalog.InstitutionStudentsRead,
                    PermissionCatalog.InstitutionStudentsManage,
                    PermissionCatalog.InstitutionAcademicRead,
                    PermissionCatalog.InstitutionEnrollmentsRead,
                    PermissionCatalog.InstitutionEnrollmentsManage,
                    PermissionCatalog.InstitutionReportCardsRead
                ]),
            [Teacher] = (
                "Docente",
                "Trabaja únicamente con sus secciones y asignaturas asignadas para asistencia y calificaciones.",
                [
                    PermissionCatalog.InstitutionContextRead,
                    PermissionCatalog.InstitutionStudentsRead,
                    PermissionCatalog.InstitutionAcademicRead,
                    PermissionCatalog.InstitutionAttendanceRead,
                    PermissionCatalog.InstitutionAttendanceRecord,
                    PermissionCatalog.InstitutionGradingRead,
                    PermissionCatalog.InstitutionGradingRecord
                ]),
            [Guardian] = (
                "Responsable familiar",
                "Identifica a responsables familiares para un futuro portal con acceso por estudiante vinculado.",
                [PermissionCatalog.InstitutionContextRead])
        };

    private static string[] AllInstitutionPermissions() =>
        PermissionCatalog.All
            .Where(p => p.Scope == PermissionScope.Institution)
            .Select(p => p.Code)
            .ToArray();
}
