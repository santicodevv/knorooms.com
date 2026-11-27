import { Input } from "@/components/ui/input";
import { StudentFormField } from "./student-form-field";
import { StudentSidePanel } from "./student-side-panel";
import { ProblemAlert } from "@/components/api/problem-alert";
import type { ReturnTypeOfStudents } from "../hooks/use-students-workspace";
import styles from "./students.module.css";
export function StudentCreateForm({
  state: s,
  guardian = false,
}: {
  state: ReturnTypeOfStudents;
  guardian?: boolean;
}) {
  const studentErrors = s.studentForm.formState.errors;
  const guardianErrors = s.guardianForm.formState.errors;
  return (
    <StudentSidePanel
      title={guardian ? "Nuevo responsable" : "Nuevo estudiante"}
      subtitle={guardian ? "Padre, madre o tutor" : "Expediente permanente"}
      busy={s.isPending}
      onClose={s.closeCreatePanel}
      onSubmit={guardian ? s.submitCreateGuardian : s.submitCreateStudent}
      submitLabel={guardian ? "Registrar responsable" : "Crear expediente"}
    >
      {s.feedback?.tone === "error" && (
        <ProblemAlert
          problem={{
            title: s.feedback.title,
            status: s.feedback.status ?? 500,
            detail: s.feedback.detail,
          }}
        />
      )}
      {guardian ? (
        <>
          <StudentFormField
            id="guardian-fullName"
            label="Nombre completo *"
            error={guardianErrors.fullName?.message}
          >
            <Input
              id="guardian-fullName"
              autoFocus
              autoComplete="name"
              aria-invalid={!!guardianErrors.fullName}
              aria-describedby={guardianErrors.fullName ? "guardian-fullName-error" : undefined}
              placeholder="Nombre y apellidos"
              disabled={s.isPending}
              {...s.guardianForm.register("fullName")}
            />
          </StudentFormField>
          <StudentFormField
            id="guardian-email"
            label="Correo electrónico *"
            error={guardianErrors.email?.message}
          >
            <Input
              id="guardian-email"
              type="email"
              autoComplete="email"
              aria-invalid={!!guardianErrors.email}
              aria-describedby={guardianErrors.email ? "guardian-email-error" : undefined}
              placeholder="correo@ejemplo.com"
              disabled={s.isPending}
              {...s.guardianForm.register("email")}
            />
          </StudentFormField>
          <StudentFormField
            id="guardian-phoneNumber"
            label="Teléfono"
            error={guardianErrors.phoneNumber?.message}
          >
            <Input
              id="guardian-phoneNumber"
              type="tel"
              autoComplete="tel"
              aria-invalid={!!guardianErrors.phoneNumber}
              aria-describedby={
                guardianErrors.phoneNumber ? "guardian-phoneNumber-error" : undefined
              }
              disabled={s.isPending}
              {...s.guardianForm.register("phoneNumber")}
            />
          </StudentFormField>
        </>
      ) : (
        <>
          <StudentFormField
            id="student-code"
            label="Código de expediente *"
            error={studentErrors.studentCode?.message}
          >
            <Input
              id="student-code"
              autoFocus
              autoComplete="off"
              placeholder="Código del expediente"
              aria-invalid={!!studentErrors.studentCode}
              aria-describedby={studentErrors.studentCode ? "student-code-error" : undefined}
              disabled={s.isPending}
              {...s.studentForm.register("studentCode")}
            />
          </StudentFormField>
          <div className="grid grid-cols-2 gap-4">
            <StudentFormField
              id="student-firstName"
              label="Nombres *"
              error={studentErrors.firstName?.message}
            >
              <Input
                id="student-firstName"
                autoComplete="given-name"
                aria-invalid={!!studentErrors.firstName}
                aria-describedby={studentErrors.firstName ? "student-firstName-error" : undefined}
                disabled={s.isPending}
                {...s.studentForm.register("firstName")}
              />
            </StudentFormField>
            <StudentFormField
              id="student-lastName"
              label="Apellidos *"
              error={studentErrors.lastName?.message}
            >
              <Input
                id="student-lastName"
                autoComplete="family-name"
                aria-invalid={!!studentErrors.lastName}
                aria-describedby={studentErrors.lastName ? "student-lastName-error" : undefined}
                disabled={s.isPending}
                {...s.studentForm.register("lastName")}
              />
            </StudentFormField>
          </div>
          <StudentFormField
            id="student-birthDate"
            label="Fecha de nacimiento *"
            error={studentErrors.birthDate?.message}
          >
            <Input
              id="student-birthDate"
              type="date"
              min="1995-01-01"
              aria-invalid={!!studentErrors.birthDate}
              aria-describedby={studentErrors.birthDate ? "student-birthDate-error" : undefined}
              disabled={s.isPending}
              {...s.studentForm.register("birthDate")}
            />
          </StudentFormField>
          <StudentFormField
            id="student-sigerd"
            label="Identificador SIGERD (opcional)"
            hint="Si el estudiante ya tiene uno asignado."
            error={studentErrors.sigerdExternalId?.message}
          >
            <Input
              id="student-sigerd"
              aria-invalid={!!studentErrors.sigerdExternalId}
              aria-describedby={
                studentErrors.sigerdExternalId ? "student-sigerd-error" : "student-sigerd-hint"
              }
              disabled={s.isPending}
              {...s.studentForm.register("sigerdExternalId")}
            />
          </StudentFormField>
        </>
      )}
      <p className={styles.note}>
        {guardian
          ? "Registrar un responsable no crea una cuenta de acceso. Después podrás vincularlo a uno o varios estudiantes."
          : "El expediente es permanente. La matrícula en una sección se registra después desde su ficha."}
      </p>
    </StudentSidePanel>
  );
}
