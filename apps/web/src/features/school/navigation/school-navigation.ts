import type { AppSidebarIconName, AppSidebarNavItem } from "@/components/shell/app-sidebar";

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
  group?: string;
  permission?: string;
  description?: string;
}
export const SCHOOL_NAV_GROUPS = [
  { label: "Estudiantes", icon: "userRound" },
  { label: "Académico", icon: "graduationCap" },
  { label: "Actividad", icon: "calendarDays" },
  { label: "Ajustes", icon: "sliders" },
] as const satisfies readonly { label: string; icon: AppSidebarIconName }[];
export const SCHOOL_NAV_ITEMS: SchoolNavItem[] = [
  { tab: "overview", href: "/", label: "Inicio", icon: "home" },
  {
    tab: "students",
    href: "/students",
    label: "Estudiantes",
    icon: "userRound",
    group: "Estudiantes",
    permission: "institution.students.read",
  },
  {
    tab: "guardians",
    href: "/guardians",
    label: "Responsables",
    icon: "heart",
    group: "Estudiantes",
    permission: "institution.students.read",
  },
  {
    tab: "academic",
    href: "/academic/years",
    label: "Años escolares",
    icon: "calendarDays",
    group: "Académico",
    permission: "institution.academic.read",
  },
  {
    tab: "academic",
    href: "/academic/grades",
    label: "Grados y secciones",
    icon: "graduationCap",
    group: "Académico",
    permission: "institution.academic.read",
  },
  {
    tab: "academic",
    href: "/academic/subjects",
    label: "Materias",
    icon: "book",
    group: "Académico",
    permission: "institution.academic.read",
  },
  {
    tab: "academic",
    href: "/academic/assignments",
    label: "Carga docente",
    icon: "users",
    group: "Académico",
    permission: "institution.academic.read",
  },
  {
    tab: "enrollments",
    href: "/enrollments",
    label: "Matrículas",
    icon: "clipboardCheck",
    group: "Académico",
    permission: "institution.enrollments.read",
  },
  {
    tab: "attendance",
    href: "/attendance",
    label: "Asistencia",
    icon: "calendarDays",
    group: "Actividad",
    permission: "institution.attendance.read",
  },
  {
    tab: "grading",
    href: "/grading",
    label: "Calificaciones",
    icon: "book",
    group: "Actividad",
    permission: "institution.grading.read",
  },
  {
    tab: "report-cards",
    href: "/report-cards",
    label: "Boletas",
    icon: "file",
    group: "Actividad",
    permission: "institution.report-cards.read",
  },
  {
    tab: "settings",
    href: "/settings",
    label: "Colegio",
    icon: "building",
    group: "Ajustes",
    permission: "institution.context.read",
  },
  {
    tab: "members",
    href: "/members",
    label: "Usuarios",
    icon: "users",
    group: "Ajustes",
    permission: "institution.members.read",
  },
  {
    tab: "settings",
    href: "/settings/policies",
    label: "Políticas de evaluación",
    icon: "clipboardCheck",
    group: "Ajustes",
    permission: "institution.grading.read",
  },
  {
    tab: "moodle",
    href: "/moodle",
    label: "Moodle",
    icon: "layers",
    group: "Ajustes",
    permission: "institution.context.read",
  },
];
export function getSchoolNavigationItems(permissions: readonly string[]): AppSidebarNavItem[] {
  return SCHOOL_NAV_ITEMS.filter(
    (item) => !item.permission || permissions.includes(item.permission),
  ).map((item) => ({
    key: item.href,
    href: item.href,
    label: item.label,
    icon: item.icon,
    group: item.group,
  }));
}
export function normalizeSchoolPath(pathname: string): string {
  const path = pathname.replace(/^\/school(?=\/|$)/, "") || "/";
  if (path === "/academic") return "/academic/years";
  if (path === "/evaluations") return "/grading";
  if (path.startsWith("/academic/sections")) return "/academic/grades";
  return path;
}
export function getActiveSchoolNavigationItem(
  items: readonly AppSidebarNavItem[],
  pathname: string,
  fallbackKey = "/",
): AppSidebarNavItem | undefined {
  const path = normalizeSchoolPath(pathname);
  return (
    [...items]
      .sort((a, b) => b.href.length - a.href.length)
      .find(
        (item) => path === item.href || (item.href !== "/" && path.startsWith(item.href + "/")),
      ) ?? items.find((item) => item.key === fallbackKey)
  );
}
