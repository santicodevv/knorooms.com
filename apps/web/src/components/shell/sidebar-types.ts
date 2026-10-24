import type { ReactNode } from "react";
import {
  Building2,
  CalendarCheck,
  BookOpen,
  FileText,
  Settings,
  Layers3,
  LayoutDashboard,
  ShieldCheck,
  ClipboardCheck,
  ContactRound,
  GraduationCap,
  Server,
  ShieldAlert,
  Users,
} from "lucide-react";
export const APP_SIDEBAR_ICONS = {
  building: Building2,
  calendar: CalendarCheck,
  book: BookOpen,
  file: FileText,
  settings: Settings,
  layers: Layers3,
  dashboard: LayoutDashboard,
  server: Server,
  shieldCheck: ShieldCheck,
  graduationCap: GraduationCap,
  contactRound: ContactRound,
  clipboardCheck: ClipboardCheck,
  users: Users,
  shieldAlert: ShieldAlert,
} as const;

export type AppSidebarIconName = keyof typeof APP_SIDEBAR_ICONS;

export interface AppSidebarNavItem {
  key: string;
  href: string;
  label: string;
  icon: AppSidebarIconName;
  description?: string;
  group?: string;
  badge?: number;
}

export interface AppSidebarProps {
  variant?: "platform" | "school";
  brandName: string;
  brandSubtitle?: string;
  brandIcon: AppSidebarIconName;
  navItems: AppSidebarNavItem[];
  activeKey: string;
  user: {
    name: string;
    email: string;
    roleLabels?: string[];
  };
  footer?: ReactNode;
  navAriaLabel?: string;
}
