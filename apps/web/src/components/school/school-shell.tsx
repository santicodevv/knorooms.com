import { LoginPromptCard } from "@/components/auth/login-prompt-card";
import { SchoolAccessErrorView } from "@/features/school/components/school-access-error-view";
import { SchoolHeader, type SchoolNavigationTab } from "@/features/school/components/school-header";
import {
  SupportModeCallout,
  SupportModeTopStrip,
} from "@/features/school/components/support-mode-banner";
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
      <LoginPromptCard
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

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      {isSupportAccess ? (
        <SupportModeTopStrip
          institutionName={context.tenant.name}
          expiresAt={context.supportAccessExpiresAt}
        />
      ) : null}

      <SchoolHeader
        context={context}
        rawHost={rawHost}
        userName={session.user.name}
        userEmail={session.user.email}
        csrfToken={session.csrfToken}
        activeTab={activeTab}
      />

      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
        {isSupportAccess ? (
          <SupportModeCallout
            institutionName={context.tenant.name}
            expiresAt={context.supportAccessExpiresAt}
          />
        ) : null}
        {children}
      </main>
    </div>
  );
}
