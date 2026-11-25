import { ButtonLink } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { SchoolDashboardSection } from "../../schemas/school-dashboard-types";
import { SchoolHomePanel } from "./school-home-panel";
import styles from "./school-home.module.css";
export function SchoolHomeSections({
  sections,
  available,
  hasData,
  allowed,
}: {
  sections: readonly SchoolDashboardSection[];
  available: boolean;
  hasData: boolean;
  allowed: boolean;
}) {
  return (
    <SchoolHomePanel
      title="Ocupación por sección"
      description={hasData ? undefined : "Matrículas activas y capacidad registrada."}
      actions={
        allowed && (
          <ButtonLink href="/enrollments" variant="outline" size={hasData ? "sm" : "default"}>
            Ver matrículas
          </ButtonLink>
        )
      }
      className={hasData ? undefined : "h-full"}
    >
      {sections.map((section) => {
        const atCapacity =
          section.capacity > 0 && section.activeEnrollmentsCount / section.capacity > 0.95;
        return (
          <div key={section.sectionId} className={styles.section}>
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-school-ink text-school-button font-semibold">
                {section.gradeLevelName} {section.sectionCode}
              </h3>
              <span className="text-school-secondary text-school-small">
                {section.activeEnrollmentsCount}/{section.capacity}
              </span>
            </div>
            <progress
              className={cn(styles.progress, atCapacity && styles.atCapacity)}
              aria-label={"Ocupación de " + section.gradeLevelName + " " + section.sectionCode}
              max={Math.max(1, section.capacity)}
              value={section.activeEnrollmentsCount}
            />
            {atCapacity && (
              <span className="text-school-warning text-school-label">Más del 95 % de cupo</span>
            )}
          </div>
        );
      })}
      {sections.length === 0 && (
        <p className="text-school-secondary text-school-small p-5.5">
          {!allowed
            ? "No tienes permiso para consultar las secciones."
            : available
              ? "No hay secciones para el año seleccionado."
              : "Información de secciones no disponible."}
        </p>
      )}
    </SchoolHomePanel>
  );
}
