import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { AcademicIcon } from "./academic-icon";
import { SchoolIcon } from "@/components/shared/school-icon";
import { getEducationalStageMeta, getSchoolShiftMeta } from "../schemas/academic-schemas";
import { AcademicYearFilter } from "./academic-filters";
import type { AcademicState } from "../hooks/use-academic-workspace";
import styles from "./academic.module.css";
export function AcademicGradesDirectory({
  state: s,
  canManage,
}: {
  state: AcademicState;
  canManage: boolean;
}) {
  const grades = s.overview.gradeLevels.filter(
    (item) => s.gradeFilterId === "all" || item.id === s.gradeFilterId,
  );
  const grade = s.overview.gradeLevels.find((item) => item.id === s.selectedGradeLevelId);
  return (
    <>
      <div className={styles.filters}>
        <AcademicYearFilter state={s} />
        <label className={styles.select}>
          <span>Grado</span>
          <select
            aria-label="Filtrar grado"
            value={s.gradeFilterId}
            onChange={(e) => {
              s.setGradeFilterId(e.target.value);
              s.setSelectedGradeLevelId(
                e.target.value === "all" ? (s.overview.gradeLevels[0]?.id ?? "") : e.target.value,
              );
            }}
          >
            <option value="all">Todos los grados</option>
            {s.overview.gradeLevels.map((item) => (
              <option value={item.id} key={item.id}>
                {item.displayName}
              </option>
            ))}
          </select>
          <span className={styles.selectIcon}>
            <SchoolIcon name="down" />
          </span>
        </label>
      </div>
      <div className={styles.gradeLayout}>
        <section className={styles.surface} aria-label="Grados">
          <div className={styles.panelHeading}>
            <div>
              <h2 className="text-school-card">Grados</h2>
              <p className="text-school-small text-school-secondary mt-1">
                {grades.length} grado{grades.length === 1 ? "" : "s"} registrado
                {grades.length === 1 ? "" : "s"}
              </p>
            </div>
          </div>
          <div className={styles.gradeList}>
            {grades.map((item) => (
              <button
                type="button"
                key={item.id}
                className={"ui-button " + styles.gradeItem}
                aria-pressed={item.id === s.selectedGradeLevelId}
                onClick={() => s.setSelectedGradeLevelId(item.id)}
              >
                <span className="text-school-button block font-semibold">{item.displayName}</span>
                <span className="text-school-label text-school-secondary mt-1 block">
                  {item.code} · {getEducationalStageMeta(item.stage).label}
                </span>
              </button>
            ))}
            {!grades.length && (
              <p className="text-school-secondary text-school-small p-3">
                No hay grados registrados.
              </p>
            )}
          </div>
        </section>
        <section className={styles.surface} aria-label="Secciones del grado">
          <header className={styles.panelHeading}>
            <div>
              <h2 className="text-school-card">{grade?.displayName ?? "Secciones del grado"}</h2>
              <p className="text-school-small text-school-secondary mt-1">
                {s.filteredSections.length} sección{s.filteredSections.length === 1 ? "" : "es"}
                {s.activeAcademicYear ? " en " + s.activeAcademicYear.code : ""}
              </p>
            </div>
            {canManage && (
              <Button
                variant="outline"
                disabled={!grade || !s.activeAcademicYear || s.activeAcademicYear.isClosed}
                onClick={() => s.toggleDrawer("section")}
              >
                <AcademicIcon name="plus-dark" />
                Crear sección
              </Button>
            )}
          </header>
          {!s.filteredSections.length ? (
            <EmptyState
              variant="school"
              title={grade ? "Aún no hay secciones" : "Selecciona o registra un grado"}
              description={
                s.activeAcademicYear?.isClosed
                  ? "Este año está cerrado. Puedes consultar la estructura existente."
                  : "Las secciones pertenecen a un grado y un año escolar."
              }
            />
          ) : (
            <div className={styles.sections}>
              {s.filteredSections.map((section) => {
                const occupancy = s.sectionCapacities?.find(
                  (item) => item.sectionId === section.id,
                );
                return (
                  <article key={section.id} className={styles.section}>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="text-school-card">Sección {section.code}</h3>
                      <Badge variant="secondary">
                        {getSchoolShiftMeta(section.shift).shortLabel}
                      </Badge>
                    </div>
                    <p className="text-school-small text-school-secondary mt-3">
                      Año escolar {section.academicYearCode}
                    </p>
                    <div className="mt-4 flex items-center gap-2">
                      {occupancy ? (
                        <>
                          <progress
                            value={occupancy.activeEnrollmentsCount}
                            max={Math.max(1, occupancy.capacity)}
                            aria-label={`Ocupación de la sección ${section.code}`}
                          />
                          <span className="text-school-label text-school-secondary shrink-0">
                            {occupancy.activeEnrollmentsCount}/{occupancy.capacity}
                          </span>
                        </>
                      ) : (
                        <p className="text-school-label text-school-secondary">
                          Capacidad registrada: {section.capacity}
                        </p>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </>
  );
}
