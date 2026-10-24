import { SchoolField } from "../../components/school-ui";
import { Input } from "@/components/ui/input";
import type { AcademicState } from "../hooks/use-academic-workspace";
export function AcademicYearFields({ state: s }: { state: AcademicState }) {
  return (
    <>
      <SchoolField label="Código *" error={s.yearForm.formState.errors.code?.message}>
        <Input placeholder="2026-2027" {...s.yearForm.register("code")} />
      </SchoolField>
      <SchoolField label="Nombre *" error={s.yearForm.formState.errors.name?.message}>
        <Input {...s.yearForm.register("name")} />
      </SchoolField>
      <SchoolField label="Fecha de inicio *" error={s.yearForm.formState.errors.startDate?.message}>
        <Input type="date" {...s.yearForm.register("startDate")} />
      </SchoolField>
      <SchoolField label="Fecha de cierre *" error={s.yearForm.formState.errors.endDate?.message}>
        <Input type="date" {...s.yearForm.register("endDate")} />
      </SchoolField>
    </>
  );
}
