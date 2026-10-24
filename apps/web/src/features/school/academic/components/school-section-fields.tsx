import { SchoolField, schoolSelectClass } from "../../components/school-ui";
import { Input } from "@/components/ui/input";
import type { AcademicState } from "../hooks/use-academic-workspace";
import { SCHOOL_SHIFT_OPTIONS } from "../schemas/academic-schemas";
export function SchoolSectionFields({ state: s }: { state: AcademicState }) {
  return (
    <>
      <SchoolField
        label="Año escolar *"
        error={s.sectionForm.formState.errors.academicYearId?.message}
      >
        <select className={schoolSelectClass} {...s.sectionForm.register("academicYearId")}>
          <option value="">Seleccionar año</option>
          {s.overview.academicYears
            .filter((y) => !y.isClosed)
            .map((y) => (
              <option key={y.id} value={y.id}>
                {y.code}
              </option>
            ))}
        </select>
      </SchoolField>
      <SchoolField label="Grado *" error={s.sectionForm.formState.errors.gradeLevelId?.message}>
        <select className={schoolSelectClass} {...s.sectionForm.register("gradeLevelId")}>
          <option value="">Seleccionar grado</option>
          {s.overview.gradeLevels.map((g) => (
            <option key={g.id} value={g.id}>
              {g.displayName}
            </option>
          ))}
        </select>
      </SchoolField>
      <SchoolField label="Código de sección *" error={s.sectionForm.formState.errors.code?.message}>
        <Input placeholder="A" {...s.sectionForm.register("code")} />
      </SchoolField>
      <SchoolField label="Tanda *" error={s.sectionForm.formState.errors.shift?.message}>
        <select className={schoolSelectClass} {...s.sectionForm.register("shift")}>
          {SCHOOL_SHIFT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </SchoolField>
      <SchoolField label="Capacidad *" error={s.sectionForm.formState.errors.capacity?.message}>
        <Input
          type="number"
          min={1}
          max={120}
          {...s.sectionForm.register("capacity", { valueAsNumber: true })}
        />
      </SchoolField>
    </>
  );
}
