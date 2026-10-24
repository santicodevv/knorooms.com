"use client";
import Link from "next/link";
import { ArrowRight, BookOpen, CalendarCheck, Users, GraduationCap } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { SchoolPageHeading, SchoolPanel, SchoolMetrics, schoolSelectClass } from "./school-ui";
import { useSchoolDashboard, type SchoolDashboardData } from "../hooks/use-school-dashboard";
export function SchoolDashboard({ data }: { data: SchoolDashboardData }) {
  const s = useSchoolDashboard(data),
    max = Math.max(1, ...s.chart.map((c) => c.count));
  const tasks = [
    {
      label: "Pasar lista",
      detail: "Seleccionar sección y fecha",
      href: "/attendance",
      permission: "institution.attendance.read",
      Icon: CalendarCheck,
    },
    {
      label: "Registrar calificaciones",
      detail: "Abrir el libro de notas",
      href: "/grading",
      permission: "institution.grading.read",
      Icon: BookOpen,
    },
    {
      label: "Buscar estudiante",
      detail: "Consultar su expediente",
      href: "/students",
      permission: "institution.students.read",
      Icon: Users,
    },
    {
      label: "Organizar año escolar",
      detail: "Grados, secciones y materias",
      href: "/academic/years",
      permission: "institution.academic.read",
      Icon: GraduationCap,
    },
  ].filter((t) => data.permissions.includes(t.permission));
  return (
    <>
      <SchoolPageHeading
        title={"Hola, " + data.name.split(" ")[0]}
        description="Esto es lo que sucede en tu colegio. Selecciona una tarea para continuar."
        actions={
          data.academic ? (
            <label className="text-muted space-y-2 text-xs">
              Año escolar
              <select
                aria-label="Año escolar del resumen"
                className={schoolSelectClass}
                value={s.year}
                onChange={(e) => s.setYear(e.target.value)}
              >
                {data.academic.academicYears.map((y) => (
                  <option key={y.id} value={y.id}>
                    {y.code}
                  </option>
                ))}
              </select>
            </label>
          ) : undefined
        }
      />
      <SchoolMetrics
        items={[
          {
            label: "Estudiantes activos",
            value: data.directory
              ? data.directory.students.filter((st) => st.isActive).length
              : "—",
            note: "Expedientes permanentes",
          },
          {
            label: "Matrículas vigentes",
            value: data.enrollments ? s.active.length : "—",
            note: s.yearData?.code ?? "Años disponibles",
          },
          {
            label: "Secciones habilitadas",
            value: data.enrollments ? s.sections.length : "—",
            note: "Para el año seleccionado",
          },
          {
            label: "Cupos disponibles",
            value: data.enrollments ? s.sections.reduce((a, b) => a + b.availableSeats, 0) : "—",
            note: "Según la capacidad registrada",
          },
        ]}
      />
      <div className="mb-5 grid gap-5 xl:grid-cols-[1.5fr_1fr]">
        <SchoolPanel
          title="Matrículas registradas por mes"
          description="Registros del año seleccionado, incluidos traslados."
        >
          {data.enrollments && s.chart.some((c) => c.count > 0) ? (
            <div
              className="flex h-60 items-end gap-2 px-6 pt-8 pb-6"
              role="img"
              aria-label={s.chart.map((c) => c.label + ": " + c.count).join(", ")}
            >
              {s.chart.map((c) => (
                <div
                  key={c.key}
                  className="flex h-full min-w-0 flex-1 flex-col justify-end text-center"
                >
                  <span className="mb-2 text-[10px] font-semibold text-slate-700">{c.count}</span>
                  <div
                    className="mx-auto w-full max-w-8 rounded-t-md bg-blue-600"
                    style={{ height: (c.count / max) * 130 + "px" }}
                  />
                  <span className="text-muted mt-3 truncate text-[10px]">{c.label}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-muted flex h-60 items-center justify-center p-6 text-xs">
              Las matrículas registradas aparecerán aquí cuando haya datos disponibles.
            </div>
          )}
        </SchoolPanel>
        <SchoolPanel
          title="Ocupación por sección"
          description="Matrículas activas y capacidad registrada."
          actions={
            data.enrollments ? (
              <ButtonLink size="sm" variant="outline" href="/enrollments">
                Ver matrículas
              </ButtonLink>
            ) : undefined
          }
        >
          <div className="max-h-60 space-y-5 overflow-y-auto p-5">
            {s.sections.map((sec) => (
              <div key={sec.sectionId}>
                <div className="mb-2 flex justify-between gap-3 text-xs">
                  <strong className="text-slate-700">
                    {sec.gradeLevelName} {sec.sectionCode}
                  </strong>
                  <span className="text-muted">
                    {sec.activeEnrollmentsCount}/{sec.capacity}
                  </span>
                </div>
                <progress
                  aria-label={"Ocupación de " + sec.gradeLevelName + " " + sec.sectionCode}
                  className="h-1.5 w-full accent-blue-600"
                  max={sec.capacity}
                  value={sec.activeEnrollmentsCount}
                />
              </div>
            ))}
            {!s.sections.length && (
              <p className="text-muted py-8 text-xs">
                No hay secciones disponibles para este resumen.
              </p>
            )}
          </div>
        </SchoolPanel>
      </div>
      <div className="grid gap-5 xl:grid-cols-[1.5fr_1fr]">
        <SchoolPanel title="Tu trabajo hoy" description="Accesos a las tareas más frecuentes.">
          <div className="grid gap-3 p-5 sm:grid-cols-2">
            {tasks.map((t) => (
              <Link
                href={t.href}
                key={t.href}
                className="group flex items-center gap-3 rounded-xl border border-slate-200 p-4 hover:border-blue-400 hover:bg-blue-50"
              >
                <span className="rounded-lg bg-blue-50 p-2.5 text-blue-700">
                  <t.Icon className="size-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <strong className="block text-xs text-slate-800">{t.label}</strong>
                  <span className="text-muted mt-1 block text-[11px]">{t.detail}</span>
                </span>
                <ArrowRight className="size-3 text-blue-600" />
              </Link>
            ))}
            {!tasks.length && (
              <p className="text-muted text-xs">
                Tu equipo de administración puede revisar los accesos asignados a tu cuenta.
              </p>
            )}
          </div>
        </SchoolPanel>
        <SchoolPanel
          title="Situaciones para revisar"
          description="Información calculada con los registros disponibles."
        >
          <div className="space-y-4 p-5">
            {data.directory && data.enrollments && (
              <Link
                href="/students"
                className="flex items-center justify-between gap-4 rounded-xl border border-amber-200 bg-amber-50 p-4"
              >
                <span>
                  <strong className="text-xs text-amber-950">Sin matrícula activa</strong>
                  <span className="mt-1 block text-[11px] text-amber-900">
                    Estudiantes activos del año seleccionado.
                  </span>
                </span>
                <strong className="text-lg text-amber-950">{s.unassigned.length}</strong>
              </Link>
            )}
            <p className="text-muted text-xs leading-6">
              Completa los años, grados y secciones antes de matricular. Las notas y boletas se
              gestionan por sección y período.
            </p>
          </div>
        </SchoolPanel>
      </div>
    </>
  );
}
