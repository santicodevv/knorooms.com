import { cn } from "@/lib/utils";
import { enrollmentSectionLabel } from "../schemas/enrollment-selectors";
import type { EnrollmentsWorkspaceState } from "../hooks/use-enrollments-workspace";
import styles from "./enrollments.module.css";

export function EnrollmentSections({ state: s }: { state: EnrollmentsWorkspaceState }) {
  return (
    <section className={styles.panel} aria-label="Secciones disponibles">
      <header className={styles.sectionsHeader}>
        <h2 className={styles.sectionsTitle}>Secciones</h2>
        <p className={styles.description}>
          {s.sections.length} {s.sections.length === 1 ? "sección" : "secciones"} ·{" "}
          {s.availableSeats} cupos disponibles
        </p>
      </header>
      {s.sections.length ? (
        <ul className={styles.sectionList}>
          {s.sections.map((section) => (
            <li key={section.sectionId}>
              <button
                type="button"
                className={cn(
                  styles.section,
                  s.selectedSection?.sectionId === section.sectionId && styles.sectionSelected,
                )}
                aria-pressed={s.selectedSection?.sectionId === section.sectionId}
                onClick={() => s.changeSection(section.sectionId)}
              >
                <span className="flex items-center gap-2">
                  <span className="min-w-0 flex-1 text-left font-semibold break-words">
                    {enrollmentSectionLabel(section)}
                  </span>
                  <span className="text-school-secondary text-school-small tabular-nums">
                    {section.activeEnrollmentsCount}/{section.capacity}
                  </span>
                </span>
                <progress
                  className={styles.progress}
                  max={Math.max(1, section.capacity)}
                  value={section.activeEnrollmentsCount}
                  aria-label={`Ocupación de ${enrollmentSectionLabel(section)}`}
                />
                {section.isAcademicYearClosed && (
                  <span className="text-school-small text-school-secondary">
                    Año cerrado · Solo consulta
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-school-secondary text-school-small p-5">
          No hay secciones en este año escolar.
        </p>
      )}
    </section>
  );
}
