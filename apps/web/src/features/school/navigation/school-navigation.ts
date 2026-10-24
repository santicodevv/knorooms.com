import type { AppSidebarIconName } from "@/components/shell/app-sidebar";
export type SchoolNavigationTab =
  | "overview"
  | "academic"
  | "students"
  | "enrollments"
  | "guardians"
  | "attendance"
  | "grading"
  | "report-cards"
  | "members"
  | "settings"
  | "moodle"
  | "support-access";
export interface SchoolNavItem {
  tab: SchoolNavigationTab;
  href: string;
  label: string;
  icon: AppSidebarIconName;
  group: string;
  description?: string;
}
export const SCHOOL_NAV_ITEMS: SchoolNavItem[] = [
  { tab: "overview", href: "/", label: "Inicio", icon: "dashboard", group: "MI COLEGIO" },
  {
    tab: "students",
    href: "/students",
    label: "Estudiantes",
    icon: "contactRound",
    group: "GESTIÓN ESCOLAR",
  },
  {
    tab: "enrollments",
    href: "/enrollments",
    label: "Matrículas",
    icon: "clipboardCheck",
    group: "GESTIÓN ESCOLAR",
  },
  {
    tab: "guardians",
    href: "/guardians",
    label: "Responsables",
    icon: "users",
    group: "GESTIÓN ESCOLAR",
  },
  {
    tab: "academic",
    href: "/academic/years",
    label: "Organización académica",
    icon: "graduationCap",
    group: "GESTIÓN ESCOLAR",
  },
  {
    tab: "attendance",
    href: "/attendance",
    label: "Asistencia",
    icon: "calendar",
    group: "ACTIVIDAD ACADÉMICA",
  },
  {
    tab: "grading",
    href: "/grading",
    label: "Calificaciones",
    icon: "book",
    group: "ACTIVIDAD ACADÉMICA",
  },
  {
    tab: "report-cards",
    href: "/report-cards",
    label: "Boletas",
    icon: "file",
    group: "ACTIVIDAD ACADÉMICA",
  },
  { tab: "members", href: "/members", label: "Equipo", icon: "users", group: "ADMINISTRACIÓN" },
  {
    tab: "settings",
    href: "/settings",
    label: "Configuración",
    icon: "settings",
    group: "ADMINISTRACIÓN",
  },
  {
    tab: "moodle",
    href: "/moodle",
    label: "Integración Moodle",
    icon: "layers",
    group: "PRÓXIMAMENTE",
  },
];
