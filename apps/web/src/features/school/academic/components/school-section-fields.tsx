import { Input } from "@/components/ui/input";
import { SchoolFormField } from "../../components/school-form-field";
import { SCHOOL_SHIFT_OPTIONS } from "../schemas/academic-schemas";
import { AcademicIcon } from "./academic-icon";
import type { AcademicState } from "../hooks/use-academic-workspace";
import styles from "./academic.module.css";
export function SchoolSectionFields({ state: s }: { state: AcademicState }) {
  const f = s.sectionForm,
    e = f.formState.errors;
  return (
    <>
      <SchoolFormField
        id="academic-section-year"
        label="Año escolar *"
        error={e.academicYearId?.message}
      >
        <div className={styles.fieldSelect}>
          <select
            id="academic-section-year"
            disabled={s.isPending}
            aria-invalid={!!e.academicYearId}
            aria-describedby={e.academicYearId ? "academic-section-year-error" : undefined}
            {...f.register("academicYearId")}
          >
            <option value="">Selecciona un año</option>
            {s.overview.academicYears
              .filter((item) => !item.isClosed)
              .map((item) => (
                <option key={item.id} value={item.id}>
                  {item.code}
                </option>
              ))}
          </select>
          <span>
            <AcademicIcon name="select-down" />
          </span>
        </div>
      </SchoolFormField>
      <SchoolFormField id="academic-section-grade" label="Grado *" error={e.gradeLevelId?.message}>
        <div className={styles.fieldSelect}>
          <select
            id="academic-section-grade"
            disabled={s.isPending}
            aria-invalid={!!e.gradeLevelId}
            aria-describedby={e.gradeLevelId ? "academic-section-grade-error" : undefined}
            {...f.register("gradeLevelId")}
          >
            <option value="">Selecciona un grado</option>
            {s.overview.gradeLevels.map((item) => (
              <option key={item.id} value={item.id}>
                {item.displayName}
              </option>
            ))}
          </select>
          <span>
            <AcademicIcon name="select-down" />
          </span>
        </div>
      </SchoolFormField>
      <div className={styles.fieldGrid}>
        <SchoolFormField id="academic-section-code" label="Identificador *" error={e.code?.message}>
          <Input
            id="academic-section-code"
            placeholder="A, B, 01"
            disabled={s.isPending}
            aria-invalid={!!e.code}
            aria-describedby={e.code ? "academic-section-code-error" : undefined}
            {...f.register("code")}
          />
        </SchoolFormField>
        <SchoolFormField
          id="academic-section-capacity"
          label="Capacidad *"
          error={e.capacity?.message}
          hint="De 1 a 120 estudiantes"
        >
          <Input
            id="academic-section-capacity"
            type="number"
            min={1}
            max={120}
            placeholder="30"
            disabled={s.isPending}
            aria-invalid={!!e.capacity}
            aria-describedby={"academic-section-capacity-" + (e.capacity ? "error" : "hint")}
            {...f.register("capacity", { valueAsNumber: true })}
          />
        </SchoolFormField>
      </div>
      <SchoolFormField id="academic-section-shift" label="Tanda *" error={e.shift?.message}>
        <div className={styles.fieldSelect}>
          <select
            id="academic-section-shift"
            disabled={s.isPending}
            aria-invalid={!!e.shift}
            aria-describedby={e.shift ? "academic-section-shift-error" : undefined}
            {...f.register("shift")}
          >
            {SCHOOL_SHIFT_OPTIONS.map((item) => (
              <option value={item.value} key={item.value}>
                {item.shortLabel}
              </option>
            ))}
          </select>
          <span>
            <AcademicIcon name="select-down" />
          </span>
        </div>
      </SchoolFormField>
    </>
  );
}
