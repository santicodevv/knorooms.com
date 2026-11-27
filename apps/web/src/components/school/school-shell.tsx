import { LogoutButton } from "@/components/auth/logout-button";
import { AppShell } from "@/components/shell/app-shell";
import {
  getSchoolNavigationItems,
  getActiveSchoolNavigationItem,
} from "@/features/school/navigation/school-navigation";
import { SchoolPageAccess, type SchoolPageAccessProps } from "./school-page-access";

export function SchoolShell(props: SchoolPageAccessProps) {
  const { session, contextResult, returnTo, children } = props;
  if (!session || !contextResult?.ok) return <SchoolPageAccess {...props} />;
  const context = contextResult.data;
  const navItems = getSchoolNavigationItems(context.permissions);
  const activeKey = getActiveSchoolNavigationItem(navItems, returnTo)?.key ?? "/";
  return (
    <SchoolPageAccess {...props} hideCommercialStatus>
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
        {children}
      </AppShell>
    </SchoolPageAccess>
  );
}
