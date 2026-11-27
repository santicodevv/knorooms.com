import { SchoolCommercialStatus } from "@/features/subscriptions/components/school-commercial-status";
import { LoginFormCard } from "@/features/auth/components/login-form-card";
import { SchoolAccessErrorView } from "@/features/school/components/school-access-error-view";
import type { SchoolNavigationTab } from "@/features/school/navigation/school-navigation";
import type { ApiResult, TenantContextDto } from "@/lib/api/types";
import type { StoredSessionRecord } from "@/lib/auth/session-store";

export interface SchoolPageAccessProps {
  session: StoredSessionRecord | null;
  rawHost: string;
  slug: string;
  returnTo: string;
  activeTab?: SchoolNavigationTab;
  children?: React.ReactNode;
  contextResult: ApiResult<TenantContextDto> | null;
  hideCommercialStatus?: boolean;
}

export function SchoolPageAccess({
  session,
  rawHost,
  slug,
  returnTo,
  contextResult,
  children,
  hideCommercialStatus = false,
}: SchoolPageAccessProps) {
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
  return (
    <>
      {!hideCommercialStatus && <SchoolCommercialStatus />}
      {children}
    </>
  );
}
