namespace Knorooms.Modules.Common.Persistence;

/// <summary>
/// Definición declarativa y auditable de las funciones y políticas Row-Level Security (RLS) de PostgreSQL.
/// Se incorpora en la migración inicial de EF Core y se ejecuta sobre PostgreSQL real.
/// </summary>
public static class PostgresRlsPolicySql
{
    private static readonly string[] StrictlyIsolatedTenantTables =
    [
        "students",
        "guardians",
        "student_guardian_links",
        "academic_years",
        "grade_levels",
        "school_sections",
        "subjects",
        "teacher_assignments",
        "student_enrollments",
        "attendance_records",
        "evaluation_policy_versions",
        "grade_entries",
        "report_card_snapshots"
    ];

    private static readonly string[] OnboardingAwareTenantTables =
    [
        "institution_roles",
        "institution_role_permissions",
        "tenant_membership_roles"
    ];

    public static string BuildUpSql()
    {
        var sb = new System.Text.StringBuilder();

        sb.AppendLine("""
            -- Funciones auxiliares estables para leer el contexto de tenant/usuario establecido con set_config
            CREATE OR REPLACE FUNCTION public.app_current_tenant_id()
            RETURNS uuid
            LANGUAGE sql
            STABLE
            AS $$
                SELECT CASE
                    WHEN NULLIF(current_setting('app.current_tenant_id', true), '') IS NULL THEN NULL::uuid
                    ELSE NULLIF(current_setting('app.current_tenant_id', true), '')::uuid
                END;
            $$;

            CREATE OR REPLACE FUNCTION public.app_current_user_id()
            RETURNS uuid
            LANGUAGE sql
            STABLE
            AS $$
                SELECT CASE
                    WHEN NULLIF(current_setting('app.current_user_id', true), '') IS NULL THEN NULL::uuid
                    ELSE NULLIF(current_setting('app.current_user_id', true), '')::uuid
                END;
            $$;

            CREATE OR REPLACE FUNCTION public.app_execution_mode()
            RETURNS text
            LANGUAGE sql
            STABLE
            AS $$
                SELECT COALESCE(NULLIF(current_setting('app.execution_mode', true), ''), 'none');
            $$;
            """);

        // 1. Tablas académicas e institucionales estrictas: NI SIQUIERA plataforma global puede leer/escribir sin tenant activo.
        foreach (var table in StrictlyIsolatedTenantTables)
        {
            sb.AppendLine($"""
                ALTER TABLE public.{table} ENABLE ROW LEVEL SECURITY;
                ALTER TABLE public.{table} FORCE ROW LEVEL SECURITY;
                DROP POLICY IF EXISTS rls_{table}_tenant_isolation ON public.{table};
                CREATE POLICY rls_{table}_tenant_isolation ON public.{table}
                    FOR ALL
                    USING (
                        public.app_execution_mode() = 'tenant'
                        AND public.app_current_tenant_id() IS NOT NULL
                        AND tenant_id = public.app_current_tenant_id()
                    )
                    WITH CHECK (
                        public.app_execution_mode() = 'tenant'
                        AND public.app_current_tenant_id() IS NOT NULL
                        AND tenant_id = public.app_current_tenant_id()
                    );
                """);
        }

        // 2. Tablas de roles institucionales: accesibles en el tenant activo o durante el alta inicial de institución (platform_onboarding).
        foreach (var table in OnboardingAwareTenantTables)
        {
            sb.AppendLine($"""
                ALTER TABLE public.{table} ENABLE ROW LEVEL SECURITY;
                ALTER TABLE public.{table} FORCE ROW LEVEL SECURITY;
                DROP POLICY IF EXISTS rls_{table}_tenant_isolation ON public.{table};
                CREATE POLICY rls_{table}_tenant_isolation ON public.{table}
                    FOR ALL
                    USING (
                        (public.app_execution_mode() = 'tenant' AND public.app_current_tenant_id() IS NOT NULL AND tenant_id = public.app_current_tenant_id())
                        OR (public.app_execution_mode() = 'platform_onboarding' AND public.app_current_tenant_id() IS NOT NULL AND tenant_id = public.app_current_tenant_id())
                    )
                    WITH CHECK (
                        (public.app_execution_mode() = 'tenant' AND public.app_current_tenant_id() IS NOT NULL AND tenant_id = public.app_current_tenant_id())
                        OR (public.app_execution_mode() = 'platform_onboarding' AND public.app_current_tenant_id() IS NOT NULL AND tenant_id = public.app_current_tenant_id())
                    );
                """);
        }

        // 3. Membresías por institución: lectura permitida al propio usuario (para /api/me) o al tenant activo; escritura solo al tenant activo o platform_onboarding.
        sb.AppendLine("""
            ALTER TABLE public.tenant_memberships ENABLE ROW LEVEL SECURITY;
            ALTER TABLE public.tenant_memberships FORCE ROW LEVEL SECURITY;
            DROP POLICY IF EXISTS rls_tenant_memberships_select ON public.tenant_memberships;
            DROP POLICY IF EXISTS rls_tenant_memberships_write ON public.tenant_memberships;

            CREATE POLICY rls_tenant_memberships_select ON public.tenant_memberships
                FOR SELECT
                USING (
                    (public.app_execution_mode() IN ('tenant', 'platform_onboarding') AND public.app_current_tenant_id() IS NOT NULL AND tenant_id = public.app_current_tenant_id())
                    OR (public.app_current_user_id() IS NOT NULL AND user_id = public.app_current_user_id())
                );

            CREATE POLICY rls_tenant_memberships_write ON public.tenant_memberships
                FOR ALL
                USING (
                    public.app_execution_mode() IN ('tenant', 'platform_onboarding')
                    AND public.app_current_tenant_id() IS NOT NULL
                    AND tenant_id = public.app_current_tenant_id()
                )
                WITH CHECK (
                    public.app_execution_mode() IN ('tenant', 'platform_onboarding')
                    AND public.app_current_tenant_id() IS NOT NULL
                    AND tenant_id = public.app_current_tenant_id()
                );
            """);

        // 4. Concesiones de acceso temporal de soporte: visibles/modificables por el colegio propietario o en modo acotado platform_support.
        sb.AppendLine("""
            ALTER TABLE public.support_access_grants ENABLE ROW LEVEL SECURITY;
            ALTER TABLE public.support_access_grants FORCE ROW LEVEL SECURITY;
            DROP POLICY IF EXISTS rls_support_access_grants_policy ON public.support_access_grants;

            CREATE POLICY rls_support_access_grants_policy ON public.support_access_grants
                FOR ALL
                USING (
                    (public.app_execution_mode() = 'tenant' AND public.app_current_tenant_id() IS NOT NULL AND tenant_id = public.app_current_tenant_id())
                    OR public.app_execution_mode() = 'platform_support'
                )
                WITH CHECK (
                    (public.app_execution_mode() = 'tenant' AND public.app_current_tenant_id() IS NOT NULL AND tenant_id = public.app_current_tenant_id())
                    OR public.app_execution_mode() = 'platform_support'
                );
            """);

        // 5. Bitácora de auditoría: cada tenant solo puede leer sus propios registros; plataforma global lee auditoría global; inserción permitida en modos válidos.
        sb.AppendLine("""
            ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
            ALTER TABLE public.audit_logs FORCE ROW LEVEL SECURITY;
            DROP POLICY IF EXISTS rls_audit_logs_select ON public.audit_logs;
            DROP POLICY IF EXISTS rls_audit_logs_insert ON public.audit_logs;

            CREATE POLICY rls_audit_logs_select ON public.audit_logs
                FOR SELECT
                USING (
                    (public.app_execution_mode() = 'tenant' AND public.app_current_tenant_id() IS NOT NULL AND tenant_id = public.app_current_tenant_id())
                    OR public.app_execution_mode() IN ('platform', 'platform_onboarding', 'platform_support')
                );

            CREATE POLICY rls_audit_logs_insert ON public.audit_logs
                FOR INSERT
                WITH CHECK (
                    (public.app_execution_mode() = 'tenant' AND public.app_current_tenant_id() IS NOT NULL AND tenant_id = public.app_current_tenant_id())
                    OR public.app_execution_mode() IN ('platform', 'platform_onboarding', 'platform_support')
                );
            """);

        return sb.ToString();
    }

    public static string BuildDownSql()
    {
        var sb = new System.Text.StringBuilder();
        foreach (var table in StrictlyIsolatedTenantTables.Concat(OnboardingAwareTenantTables))
        {
            sb.AppendLine($"DROP POLICY IF EXISTS rls_{table}_tenant_isolation ON public.{table};");
            sb.AppendLine($"ALTER TABLE public.{table} NO FORCE ROW LEVEL SECURITY;");
            sb.AppendLine($"ALTER TABLE public.{table} DISABLE ROW LEVEL SECURITY;");
        }

        sb.AppendLine("""
            DROP POLICY IF EXISTS rls_tenant_memberships_select ON public.tenant_memberships;
            DROP POLICY IF EXISTS rls_tenant_memberships_write ON public.tenant_memberships;
            ALTER TABLE public.tenant_memberships NO FORCE ROW LEVEL SECURITY;
            ALTER TABLE public.tenant_memberships DISABLE ROW LEVEL SECURITY;

            DROP POLICY IF EXISTS rls_support_access_grants_policy ON public.support_access_grants;
            ALTER TABLE public.support_access_grants NO FORCE ROW LEVEL SECURITY;
            ALTER TABLE public.support_access_grants DISABLE ROW LEVEL SECURITY;

            DROP POLICY IF EXISTS rls_audit_logs_select ON public.audit_logs;
            DROP POLICY IF EXISTS rls_audit_logs_insert ON public.audit_logs;
            ALTER TABLE public.audit_logs NO FORCE ROW LEVEL SECURITY;
            ALTER TABLE public.audit_logs DISABLE ROW LEVEL SECURITY;

            DROP FUNCTION IF EXISTS public.app_execution_mode();
            DROP FUNCTION IF EXISTS public.app_current_user_id();
            DROP FUNCTION IF EXISTS public.app_current_tenant_id();
            """);

        return sb.ToString();
    }
}
