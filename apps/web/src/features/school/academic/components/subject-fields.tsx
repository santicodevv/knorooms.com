import { SchoolField } from "../../components/school-ui";
import { Input } from "@/components/ui/input";
import type { AcademicState } from "../hooks/use-academic-workspace";
export function SubjectFields({ state: s }: { state: AcademicState }) {
  return (
    <>
      <SchoolField label="Código *" error={s.subjectForm.formState.errors.code?.message}>
        <Input {...s.subjectForm.register("code")} />
      </SchoolField>
      <SchoolField
        label="Nombre de la materia *"
        error={s.subjectForm.formState.errors.name?.message}
      >
        <Input {...s.subjectForm.register("name")} />
      </SchoolField>
    </>
  );
}
