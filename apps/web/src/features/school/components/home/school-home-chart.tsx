import { Plus } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SchoolHomePanel } from "./school-home-panel";
import styles from "./school-home.module.css";
type MonthCount = { key: string; label: string; count: number };
const emptyGuideHeights = [18, 28, 22, 38, 30, 46, 34, 26, 20, 14, 10, 8];
export function SchoolHomeChart({
  chart,
  available,
  noYear,
  allowed,
  canEnroll,
  canOrganize,
}: {
  chart: readonly MonthCount[];
  available: boolean;
  noYear: boolean;
  allowed: boolean;
  canEnroll: boolean;
  canOrganize: boolean;
}) {
  const max = Math.max(1, ...chart.map((item) => item.count));
  const hasData = available && chart.some((item) => item.count > 0);
  return (
    <SchoolHomePanel
      title="Matrículas por mes"
      description="Registros del año seleccionado, incluidos traslados."
    >
      {hasData ? (
        <div
          className={styles.chart}
          role="img"
          aria-label={chart.map((item) => item.label + ": " + item.count).join(", ")}
        >
          {chart.map((item) => (
            <div className={styles.chartColumn} key={item.key}>
              <span
                className={cn(
                  "text-school-label",
                  item.count === max ? "text-school-ink font-semibold" : "text-school-secondary",
                )}
              >
                {item.count}
              </span>
              <div
                className={cn(styles.bar, item.count === max && styles.dominantBar)}
                style={{ height: (item.count / max) * 180 }}
              />
              <span className="text-school-secondary text-school-label font-normal">
                {item.label}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.emptyChart}>
          {available && (
            <div className={styles.guide} aria-hidden="true">
              {emptyGuideHeights.map((height, index) => (
                <span key={index} className={styles.guideBar} style={{ height }} />
              ))}
            </div>
          )}
          <div>
            <h3 className="text-school-body font-semibold">
              {!allowed
                ? "Sin permiso para consultar matrículas"
                : noYear
                  ? "Aún no hay años escolares"
                  : available
                    ? "Aún no hay matrículas"
                    : "Información no disponible"}
            </h3>
            <p className="text-school-secondary text-school-small mt-1">
              {!allowed
                ? "Tu equipo de administración puede revisar los accesos de tu cuenta."
                : noYear
                  ? "Organiza el año escolar para comenzar a matricular estudiantes."
                  : available
                    ? "Cuando matricules estudiantes, verás aquí cómo avanzan mes a mes."
                    : "No se pudo obtener este resumen. Revisa los avisos de la página."}
            </p>
          </div>
          {available && canEnroll && (
            <ButtonLink variant="outline" href="/enrollments">
              <Plus aria-hidden="true" />
              Matricular estudiante
            </ButtonLink>
          )}
          {noYear && canOrganize && (
            <ButtonLink variant="outline" href="/academic/years">
              Organizar el año
            </ButtonLink>
          )}
        </div>
      )}
    </SchoolHomePanel>
  );
}
