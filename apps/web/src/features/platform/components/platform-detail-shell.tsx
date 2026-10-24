import { LogoutButton } from "@/components/auth/logout-button";
import { AppShell } from "@/components/shell/app-shell";
import { PLATFORM_NAV_ITEMS } from "../navigation/platform-navigation";
import { PlatformToolbar } from "./platform-toolbar";
import { serverApiFetch } from "@/lib/api/server-api";
import type { PlatformDashboardData } from "../schemas/dashboard-schemas";
export async function PlatformDetailShell({
  children,
  name,
  email,
  csrfToken,
  activeKey = "institutions",
  summary: initialSummary,
}: {
  children: React.ReactNode;
  name: string;
  email: string;
  csrfToken: string;
  activeKey?: "institutions" | "dashboard";
  summary?: PlatformDashboardData | null;
}) {
  const result =
    initialSummary === undefined
      ? await serverApiFetch<PlatformDashboardData>(
          "/api/platform/institution-management/dashboard",
        )
      : null;
  const summary = initialSummary === undefined ? (result?.ok ? result.data : null) : initialSummary;
  return (
    <AppShell
      sidebar={{
        brandName: "KNOROOMS",
        brandSubtitle: "Administración Global",
        brandIcon: "layers",
        navItems: PLATFORM_NAV_ITEMS.map((item) => ({
          key: item.tab,
          href: item.href,
          label: item.label,
          icon: item.icon,
          badge: item.tab === "institutions" && summary ? summary.total : undefined,
        })),
        activeKey,
        navAriaLabel: "Navegación de administración",
        user: { name, email, roleLabels: [] },
        footer: <LogoutButton csrfToken={csrfToken} />,
      }}
      topbar={<PlatformToolbar name={name} email={email} csrfToken={csrfToken} summary={summary} />}
    >
      {children}
    </AppShell>
  );
}
