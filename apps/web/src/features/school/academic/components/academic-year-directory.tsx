import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { SchoolIcon } from "@/components/shared/school-icon";
import { calculateAcademicYearProgress } from "../schemas/academic-schemas";
import { formatAcademicDate } from "../schemas/academic-view";
import type { AcademicState } from "../hooks/use-academic-workspace";
import styles from "./academic.module.css";
export function AcademicYearDirectory({
  state: s,
  canManage,
}: {
  state: AcademicState;
  canManage: boolean;
}) {
  if (!s.overview.academicYears.length)
    return (
      <section className={styles.surface}>
        <EmptyState
          variant="school"
          title="Aún no hay años escolares"
          description="Define el período escolar para crear secciones y registrar matrículas."
          action={
            canManage ? (
              <Button onClick={() => s.toggleDrawer("year")}>
                <SchoolIcon name="plus" />
                Crear año escolar
              </Button>
            ) : undefined
          }
        />
      </section>
    );
  return (
    <div className="flex flex-col gap-3">
      {s.overview.academicYears.map((year) => {
        const progress = calculateAcademicYearProgress(year.startDate, year.endDate);
        return (
          <article key={year.id} className={styles.year}>
            <div className={styles.yearInfo}>
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-school-section">
                  {canManage ? (
                    <button
                      type="button"
                      className="ui-button rounded-sm text-left hover:underline"
                      aria-label={`${year.isClosed ? "Reabrir" : "Cerrar"} año escolar ${year.code}`}
                      title={year.isClosed ? "Reabrir año escolar" : "Cerrar año escolar"}
                      disabled={s.isPending}
                      onClick={() => s.handleToggleYearStatus(year.id, year.code, year.isClosed)}
                    >
                      {year.code}
                    </button>
                  ) : (
                    year.code
                  )}
                </h2>
                <Badge variant={year.isClosed ? "secondary" : "success"}>
                  {year.isClosed ? "Cerrado" : "Vigente"}
                </Badge>
              </div>
              <p className="text-school-secondary mt-1.5 text-sm">
                {year.name} · {formatAcademicDate(year.startDate)} –{" "}
                {formatAcademicDate(year.endDate)}
              </p>
            </div>
            <div className={styles.yearProgress + (year.isClosed ? " " + styles.yearClosed : "")}>
              <p className="text-school-secondary text-school-small">
                {progress} % del año transcurrido
              </p>
              <progress
                value={progress}
                max={100}
                aria-label={`Progreso temporal del año ${year.code}`}
              />
            </div>
            {canManage && (
              <Button
                variant="outline"
                size="sm"
                disabled={s.isPending}
                onClick={() => s.handleToggleYearStatus(year.id, year.code, year.isClosed)}
              >
                {year.isClosed ? "Reabrir año" : "Cerrar año"}
              </Button>
            )}
          </article>
        );
      })}
    </div>
  );
}
