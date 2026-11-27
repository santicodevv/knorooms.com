import Link from "next/link";
import { BookOpen, CalendarCheck, GraduationCap, Search } from "lucide-react";
import { cn } from "@/lib/utils";
const tasks = [
  {
    label: "Pasar lista",
    description: "Elige sección y fecha",
    href: "/attendance",
    permission: "institution.attendance.read",
    module: "attendance",
    icon: CalendarCheck,
  },
  {
    label: "Registrar notas",
    description: "Abre el libro de calificaciones",
    href: "/grading",
    permission: "institution.grading.read",
    module: "grading",
    icon: BookOpen,
  },
  {
    label: "Buscar estudiante",
    description: "Consulta su expediente",
    href: "/students",
    permission: "institution.students.read",
    module: "students",
    icon: Search,
  },
  {
    label: "Organizar el año",
    description: "Grados, secciones y materias",
    href: "/academic/years",
    permission: "institution.academic.read",
    module: "academic",
    icon: GraduationCap,
  },
] as const;
export function SchoolHomeActions({
  permissions,
  readableModules,
}: {
  permissions: readonly string[];
  readableModules: readonly string[];
}) {
  const available = tasks.filter(
    (task) => permissions.includes(task.permission) && readableModules.includes(task.module),
  );
  if (!available.length)
    return (
      <p className="text-school-secondary text-school-small">
        No tienes tareas disponibles con los permisos y módulos de tu cuenta.
      </p>
    );
  return (
    <nav aria-label="Tareas frecuentes" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {available.map((task) => {
        const Icon = task.icon;
        const primary = task.href === "/attendance";
        return (
          <Link
            key={task.href}
            href={task.href}
            className={cn(
              "ui-button rounded-school-card flex min-w-0 items-center gap-3.5 p-4.5",
              primary ? "bg-school-ink text-school-surface" : "bg-school-surface text-school-ink",
            )}
          >
            <span
              className={cn(
                "flex size-11 shrink-0 items-center justify-center rounded-xl",
                primary ? "bg-school-secondary" : "bg-school-subtle",
              )}
            >
              <Icon className="size-5.5" strokeWidth={2} aria-hidden="true" />
            </span>
            <span className="min-w-0">
              <span className="text-school-body block font-semibold">{task.label}</span>
              <span
                className={cn(
                  "text-school-label mt-0.5 block font-normal",
                  primary ? "text-school-border" : "text-school-secondary",
                )}
              >
                {task.description}
              </span>
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
