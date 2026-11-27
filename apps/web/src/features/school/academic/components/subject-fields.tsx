import { Input } from "@/components/ui/input";
import { SchoolFormField } from "../../components/school-form-field";
import type { AcademicState } from "../hooks/use-academic-workspace";
export function SubjectFields({ state: s }: { state: AcademicState }) {
  const f = s.subjectForm,
    e = f.formState.errors;
  return (
    <>
      <SchoolFormField
        id="academic-subject-code"
        label="Código *"
        error={e.code?.message}
        hint="Código curricular, por ejemplo MAT-S4"
      >
        <Input
          id="academic-subject-code"
          placeholder="MAT-P1"
          disabled={s.isPending}
          aria-invalid={!!e.code}
          aria-describedby={"academic-subject-code-" + (e.code ? "error" : "hint")}
          {...f.register("code")}
        />
      </SchoolFormField>
      <SchoolFormField id="academic-subject-name" label="Nombre *" error={e.name?.message}>
        <Input
          id="academic-subject-name"
          placeholder="Matemática"
          disabled={s.isPending}
          aria-invalid={!!e.name}
          aria-describedby={e.name ? "academic-subject-name-error" : undefined}
          {...f.register("name")}
        />
      </SchoolFormField>
    </>
  );
}
