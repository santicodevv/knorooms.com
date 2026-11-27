"use client";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { SchoolIcon } from "@/components/shared/school-icon";
import { ProblemAlert } from "@/components/api/problem-alert";
import { useEnrollmentsWorkspace } from "../hooks/use-enrollments-workspace";
import type { EnrollmentsWorkspaceData } from "../schemas/enrollment-types";
import { EnrollmentSections } from "./enrollment-sections";
import { EnrollmentRoster } from "./enrollment-roster";
import { EnrollmentPanel } from "./enrollment-panel";
import styles from "./enrollments.module.css";

export function EnrollmentsWorkspace({ data }: { data: EnrollmentsWorkspaceData }) {
  const s = useEnrollmentsWorkspace(data);
  return (
    <div className={styles.workspace} aria-busy={s.busy}>
      <header className="flex flex-wrap items-center gap-4">
        <div className="min-w-0 basis-full lg:flex-1 lg:basis-0">
          <h1 className="text-school-page">Matrículas</h1>
          <p className="text-school-body text-school-secondary mt-1.5">
            Inscribe estudiantes en una sección del año escolar.
          </p>
        </div>
        <label className={styles.year}>
          <span>Año escolar</span>
          <select
            aria-label="Año escolar de matrículas"
            value={s.yearId}
            onChange={(event) => s.changeYear(event.target.value)}
            disabled={!s.years.length || s.busy}
          >
            {!s.years.length && <option value="">No disponible</option>}
            {s.years.map((year) => (
              <option key={year.id} value={year.id}>
                {year.code}
              </option>
            ))}
          </select>
          <SchoolIcon name="down" />
        </label>
        {s.canEnroll && (
          <Button onClick={s.openPanel} disabled={s.busy}>
            <SchoolIcon name="plus" />
            Matricular estudiante
          </Button>
        )}
      </header>
      {data.problems.length > 0 && (
        <div className="space-y-3">
          {data.problems.map(({ source, problem }) => (
            <ProblemAlert key={source} problem={problem} />
          ))}
          <Button variant="outline" onClick={s.refresh} disabled={s.refreshing}>
            Reintentar
          </Button>
        </div>
      )}
      {!data.canReadEnrollments || data.overview === null ? (
        <section className={styles.panel}>
          <EmptyState
            variant="school"
            title={
              data.problems.length
                ? "No se pudo cargar la información"
                : "Sin permiso para consultar matrículas"
            }
            description={
              data.problems.length
                ? "Vuelve a intentarlo para consultar los registros del colegio."
                : "Tu equipo de administración puede revisar los accesos de tu cuenta."
            }
          />
        </section>
      ) : (
        <>
          {s.selectedYear?.isClosed && (
            <p className="text-school-small text-school-secondary">
              El año seleccionado está cerrado. Sus matrículas permanecen disponibles para consulta.
            </p>
          )}
          {data.canManageEnrollments && (!data.canReadStudents || data.students === null) && (
            <p className="text-school-small text-school-secondary">
              La matrícula requiere consultar los expedientes. Revisa los permisos o los avisos de
              carga.
            </p>
          )}
          <div className={styles.content}>
            <EnrollmentSections state={s} />
            <EnrollmentRoster state={s} />
          </div>
        </>
      )}
      {s.panelOpen && <EnrollmentPanel state={s} />}
    </div>
  );
}
