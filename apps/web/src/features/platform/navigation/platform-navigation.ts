import type { AppSidebarIconName } from "@/components/shell/app-sidebar";

export type PlatformNavigationTab = "institutions" | "plans" | "dashboard";

export interface PlatformNavItem {
  tab: PlatformNavigationTab;
  href: string;
  label: string;
  description: string;
  icon: AppSidebarIconName;
}

export const PLATFORM_NAV_ITEMS: PlatformNavItem[] = [
  {
    tab: "dashboard",
    href: "/",
    label: "Dashboard",
    description: "Resumen de la plataforma",
    icon: "dashboard",
  },
  {
    tab: "institutions",
    href: "/institutions",
    label: "Instituciones",
    description: "Colegios, módulos y administradores",
    icon: "building",
  },
];
