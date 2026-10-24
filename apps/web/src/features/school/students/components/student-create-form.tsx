import type { ReturnTypeOfStudents } from "../hooks/use-students-workspace";
import { SchoolField, SchoolFormActions } from "../../components/school-ui";
import { Input } from "@/components/ui/input";
export function StudentCreateForm({
  state: s,
  guardian = false,
}: {
  state: ReturnTypeOfStudents;
  guardian?: boolean;
}) {
  if (guardian)
    return (
      <form onSubmit={s.submitCreateGuardian} noValidate className="space-y-6 p-6">
        <div className="grid gap-5 sm:grid-cols-2">
          <SchoolField
            label="Nombre completo *"
            error={s.guardianForm.formState.errors.fullName?.message}
          >
            <Input autoComplete="name" {...s.guardianForm.register("fullName")} />
          </SchoolField>
          <SchoolField
            label="Correo electrónico *"
            error={s.guardianForm.formState.errors.email?.message}
          >
            <Input type="email" {...s.guardianForm.register("email")} />
          </SchoolField>
          <SchoolField
            label="Teléfono"
            error={s.guardianForm.formState.errors.phoneNumber?.message}
          >
            <Input type="tel" {...s.guardianForm.register("phoneNumber")} />
          </SchoolField>
        </div>
        <p className="text-muted text-xs leading-6">
          Registrar un responsable no crea una cuenta de acceso. Después podrás vincularlo a uno o
          varios estudiantes.
        </p>
        <SchoolFormActions back="/guardians" busy={s.isPending} />
      </form>
    );
  const f = s.studentForm;
  return (
    <form onSubmit={s.submitCreateStudent} noValidate className="space-y-6 p-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <SchoolField label="Código de expediente *" error={f.formState.errors.studentCode?.message}>
          <Input placeholder="EST-2026-001" {...f.register("studentCode")} />
        </SchoolField>
        <SchoolField label="Nombres *" error={f.formState.errors.firstName?.message}>
          <Input {...f.register("firstName")} />
        </SchoolField>
        <SchoolField label="Apellidos *" error={f.formState.errors.lastName?.message}>
          <Input {...f.register("lastName")} />
        </SchoolField>
        <SchoolField label="Fecha de nacimiento *" error={f.formState.errors.birthDate?.message}>
          <Input type="date" {...f.register("birthDate")} />
        </SchoolField>
        <SchoolField
          label="Identificador SIGERD (opcional)"
          error={f.formState.errors.sigerdExternalId?.message}
        >
          <Input {...f.register("sigerdExternalId")} />
        </SchoolField>
      </div>
      <p className="text-muted text-xs leading-6">
        El expediente es permanente. La matrícula en una sección se registra después desde su ficha.
      </p>
      <SchoolFormActions back="/students" busy={s.isPending} label="Crear expediente" />
    </form>
  );
}
