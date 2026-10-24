import { SchoolField, schoolSelectClass } from "../../components/school-ui";
import { Input } from "@/components/ui/input";
import type { AcademicState } from "../hooks/use-academic-workspace";
import { EDUCATIONAL_STAGE_OPTIONS } from "../schemas/academic-schemas";
export function GradeLevelFields({ state: s }: { state: AcademicState }) {
  return (
    <>
      <SchoolField label="Nivel educativo *" error={s.gradeForm.formState.errors.stage?.message}>
        <select className={schoolSelectClass} {...s.gradeForm.register("stage")}>
          {EDUCATIONAL_STAGE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </SchoolField>
      <SchoolField
        label="Número oficial *"
        error={s.gradeForm.formState.errors.officialGradeNumber?.message}
      >
        <Input
          type="number"
          min={1}
          max={12}
          {...s.gradeForm.register("officialGradeNumber", { valueAsNumber: true })}
        />
      </SchoolField>
      <SchoolField label="Código *" error={s.gradeForm.formState.errors.code?.message}>
        <Input {...s.gradeForm.register("code")} />
      </SchoolField>
      <SchoolField
        label="Nombre del grado *"
        error={s.gradeForm.formState.errors.displayName?.message}
      >
        <Input placeholder="1.º de Secundaria" {...s.gradeForm.register("displayName")} />
      </SchoolField>
    </>
  );
}
