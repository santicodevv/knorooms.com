import { Input } from "@/components/ui/input";
import { SchoolFormField } from "../../components/school-form-field";
import { EDUCATIONAL_STAGE_OPTIONS, getEducationalStageMeta } from "../schemas/academic-schemas";
import { AcademicIcon } from "./academic-icon";
import type { AcademicState } from "../hooks/use-academic-workspace";
import styles from "./academic.module.css";
export function GradeLevelFields({ state: s }: { state: AcademicState }) {
  const f = s.gradeForm,
    e = f.formState.errors;
  return (
    <>
      <SchoolFormField
        id="academic-grade-stage"
        label="Nivel educativo *"
        error={e.stage?.message}
        hint={s.gradeStage ? getEducationalStageMeta(s.gradeStage).minerdNote : undefined}
      >
        <div className={styles.fieldSelect}>
          <select
            id="academic-grade-stage"
            disabled={s.isPending}
            aria-invalid={!!e.stage}
            aria-describedby={
              e.stage
                ? "academic-grade-stage-error"
                : s.gradeStage
                  ? "academic-grade-stage-hint"
                  : undefined
            }
            {...f.register("stage")}
          >
            <option value="">Selecciona un nivel</option>
            {EDUCATIONAL_STAGE_OPTIONS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
          <span>
            <AcademicIcon name="select-down" />
          </span>
        </div>
      </SchoolFormField>
      <div className={styles.fieldGrid}>
        <SchoolFormField
          id="academic-grade-number"
          label="Número de grado *"
          error={e.officialGradeNumber?.message}
        >
          <Input
            id="academic-grade-number"
            type="number"
            min={1}
            max={12}
            placeholder="1 a 12"
            disabled={s.isPending}
            aria-invalid={!!e.officialGradeNumber}
            aria-describedby={e.officialGradeNumber ? "academic-grade-number-error" : undefined}
            {...f.register("officialGradeNumber", { valueAsNumber: true })}
          />
        </SchoolFormField>
        <SchoolFormField id="academic-grade-code" label="Código *" error={e.code?.message}>
          <Input
            id="academic-grade-code"
            placeholder="P1"
            disabled={s.isPending}
            aria-invalid={!!e.code}
            aria-describedby={e.code ? "academic-grade-code-error" : undefined}
            {...f.register("code")}
          />
        </SchoolFormField>
      </div>
      <SchoolFormField
        id="academic-grade-name"
        label="Nombre oficial *"
        error={e.displayName?.message}
      >
        <Input
          id="academic-grade-name"
          placeholder="1.º de Primaria"
          disabled={s.isPending}
          aria-invalid={!!e.displayName}
          aria-describedby={e.displayName ? "academic-grade-name-error" : undefined}
          {...f.register("displayName")}
        />
      </SchoolFormField>
    </>
  );
}
