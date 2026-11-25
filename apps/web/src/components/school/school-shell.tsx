import { SchoolCommercialStatus } from "@/features/subscriptions/components/school-commercial-status";
import { LogoutButton } from "@/components/auth/logout-button";
import { AppShell } from "@/components/shell/app-shell";
import { LoginFormCard } from "@/features/auth/components/login-form-card";
import { SchoolAccessErrorView } from "@/features/school/components/school-access-error-view";
import {
  getSchoolNavigationItems,
  getActiveSchoolNavigationItem,
  type SchoolNavigationTab,
} from "@/features/school/navigation/school-navigation";
import type { ApiResult, TenantContextDto } from "@/lib/api/types";
import type { StoredSessionRecord } from "@/lib/auth/session-store";

interface SchoolShellProps {
  session: StoredSessionRecord | null;
  rawHost: string;
  slug: string;
  returnTo: string;
  activeTab: SchoolNavigationTab;
  children?: React.ReactNode;
  contextResult: ApiResult<TenantContextDto> | null;
  hideCommercialStatus?: boolean;
}
export function SchoolShell({
  session,
  rawHost,
  slug,
  returnTo,
  contextResult,
  children,
  hideCommercialStatus = false,
}: SchoolShellProps) {
  if (!session)
    return (
      <LoginFormCard
        variant="school"
        title="Portal del colegio"
        description="Ingresa con el correo y la contraseña de tu cuenta institucional."
        returnTo={returnTo}
        hostLabel={rawHost}
      />
    );
  if (!contextResult || !contextResult.ok) {
    const status = contextResult?.status ?? 500;
    const problem = contextResult?.problem ?? {
      title: "Error al obtener el contexto institucional",
      status,
    };
    return (
      <SchoolAccessErrorView
        status={status}
        problem={problem}
        rawHost={rawHost}
        slug={slug}
        userEmail={session.user.email}
        csrfToken={session.csrfToken}
        returnTo={returnTo}
      />
    );
  }
  const context = contextResult.data;
  const navItems = getSchoolNavigationItems(context.permissions);
  const activeKey = getActiveSchoolNavigationItem(navItems, returnTo)?.key ?? "/";
  return (
    <AppShell
      sidebar={{
        variant: "school",
        brandName: "KNOROOMS",
        brandSubtitle: context.tenant.name,
        brandIcon: "building",
        navItems,
        activeKey,
        navAriaLabel: "Navegación del portal institucional",
        user: {
          name: session.user.name,
          email: session.user.email,
          roleLabels: context.roles.map((role) => role.name),
        },
        footer: (
          <LogoutButton
            csrfToken={session.csrfToken}
            className="school:min-h-10 school:text-school-small school:font-normal w-full"
          />
        ),
      }}
    >
      {!hideCommercialStatus && <SchoolCommercialStatus />}
      {children}
    </AppShell>
  );
}
