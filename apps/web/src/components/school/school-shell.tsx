import { SchoolCommercialStatus } from "@/features/subscriptions/components/school-commercial-status";
import { LogoutButton } from "@/components/auth/logout-button";
import { AppShell } from "@/components/shell/app-shell";
import { InstitutionStatusBadge } from "@/components/shared/status-badge";

import { LoginFormCard } from "@/features/auth/components/login-form-card";
import { SchoolAccessErrorView } from "@/features/school/components/school-access-error-view";
import {
  SupportModeCallout,
  SupportModeTopStrip,
} from "@/features/school/components/support-mode-banner";
import {
  SCHOOL_NAV_ITEMS,
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
  contextResult: ApiResult<TenantContextDto> | null;
  children?: React.ReactNode;
}

export function SchoolShell({
  session,
  rawHost,
  slug,
  returnTo,
  activeTab,
  contextResult,
  children,
}: SchoolShellProps) {
  if (!session) {
    return (
      <LoginFormCard
        title={`Portal Institucional · ${slug}`}
        description="Inicie sesión con su cuenta institucional o de soporte autorizado para acceder al entorno académico de este colegio."
        returnTo={returnTo}
        hostLabel={rawHost}
      />
    );
  }

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
  const isSupportAccess = context.accessType === "Support";

  const navItems = SCHOOL_NAV_ITEMS.map((item) => ({
    key: item.tab,
    href: item.href,
    label: item.label,
    description: item.description,
    icon: item.icon,
    group: item.group,
  }));

  return (
    <div className="min-h-screen bg-slate-50">
      {isSupportAccess ? (
        <SupportModeTopStrip
          institutionName={context.tenant.name}
          expiresAt={context.supportAccessExpiresAt}
        />
      ) : null}

      <AppShell
        sidebar={{
          variant: "school",
          brandName: "KNOROOMS",
          brandSubtitle: context.tenant.name,
          brandIcon: "building",
          navItems,
          activeKey: activeTab,
          navAriaLabel: "Navegación del portal institucional",
          user: {
            name: session.user.name,
            email: session.user.email,
            roleLabels: context.roles.map((role) => role.name),
          },
          footer: <LogoutButton csrfToken={session.csrfToken} />,
        }}
        topbar={
          <>
            <div className="text-muted flex min-w-0 items-center gap-3 text-xs">
              <span className="hidden sm:inline">Portal del colegio</span>
              <span className="hidden text-slate-300 sm:inline">/</span>
              <strong className="truncate text-slate-800">
                {SCHOOL_NAV_ITEMS.find((item) => item.tab === activeTab)?.label ?? "Colegio"}
              </strong>
            </div>
            <div className="ml-auto flex items-center gap-4">
              <span className="text-muted hidden text-xs lg:block">{context.tenant.name}</span>
              <InstitutionStatusBadge
                status={context.tenant.status}
                activeLabel="Institución activa"
              />
              <span className="hidden border-l border-slate-200 pl-4 text-xs font-semibold text-slate-700 sm:block">
                {session.user.name}
              </span>
            </div>
          </>
        }
      >
        {isSupportAccess ? (
          <SupportModeCallout
            institutionName={context.tenant.name}
            expiresAt={context.supportAccessExpiresAt}
          />
        ) : null}
        <SchoolCommercialStatus />
        {children}
      </AppShell>
    </div>
  );
}
