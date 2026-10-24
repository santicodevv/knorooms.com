import { getServerSession } from "@/lib/auth/session-store";
import { serverApiFetch } from "@/lib/api/server-api";
import { LoginFormCard } from "@/features/auth/components/login-form-card";
import { PlatformDetailShell } from "@/features/platform/components/platform-detail-shell";
import { PlatformDashboard } from "@/features/platform/components/dashboard/platform-dashboard";
import type { PlatformDashboardData } from "@/features/platform/schemas/dashboard-schemas";
export default async function PlatformDashboardPage() {
  const session = await getServerSession();
  if (!session)
    return (
      <LoginFormCard
        title="Consola de Administración Global"
        description="Inicia sesión para gestionar las instituciones de KNOROOMS."
        returnTo="/"
      />
    );
  const dashboard = await serverApiFetch<PlatformDashboardData>(
    "/api/platform/institution-management/dashboard",
  );
  return (
    <PlatformDetailShell
      name={session.user.name}
      email={session.user.email}
      csrfToken={session.csrfToken}
      activeKey="dashboard"
      summary={dashboard.ok ? dashboard.data : null}
    >
      <PlatformDashboard
        initial={dashboard.ok ? dashboard.data : null}
        problem={dashboard.ok ? null : dashboard.problem}
      />
    </PlatformDetailShell>
  );
}
