import { SchoolIcon } from "@/components/shared/school-icon";
import type { AcademicState } from "../hooks/use-academic-workspace";
import styles from "./academic.module.css";
export function AcademicYearFilter({ state: s }: { state: AcademicState }) {
  return (
    <label className={styles.select}>
      <span>Año escolar</span>
      <select
        aria-label="Año escolar"
        value={s.selectedAcademicYearId}
        onChange={(e) => s.setSelectedAcademicYearId(e.target.value)}
        disabled={!s.overview.academicYears.length}
      >
        {!s.overview.academicYears.length && <option value="">No disponible</option>}
        {s.overview.academicYears.map((year) => (
          <option key={year.id} value={year.id}>
            {year.code}
          </option>
        ))}
      </select>
      <span className={styles.selectIcon}>
        <SchoolIcon name="down" />
      </span>
    </label>
  );
}
