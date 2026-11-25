import { StudentConfirmation } from "./student-confirmation";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { ProblemAlert } from "@/components/api/problem-alert";
import { StudentSidePanel } from "./student-side-panel";
import { StudentFormField } from "./student-form-field";
import type { ReturnTypeOfStudents } from "../hooks/use-students-workspace";
import styles from "./students.module.css";

export function StudentActionDialog({ state: s }: { state: ReturnTypeOfStudents }) {
  const action = s.openDrawer;
  if (s.confirmation) return <StudentConfirmation state={s} />;
  if (action !== "link-guardian" && action !== "enroll" && action !== "transfer") return null;
  const link = action === "link-guardian",
    transfer = action === "transfer";
  const label = link ? "Vincular responsable" : transfer ? "Trasladar" : "Matricular estudiante";
  const form = link
    ? s.submitLinkGuardian
    : transfer
      ? s.submitTransferSection
      : s.submitEnrollStudent;
  const subtitle = transfer
    ? `${s.transferringEnrollment?.studentFullName ?? ""} · ${s.transferringEnrollment?.gradeLevelCode ?? ""} ${s.transferringEnrollment?.sectionCode ?? ""}`
    : `${s.selectedStudent?.fullName ?? ""} · ${s.selectedStudent?.studentCode ?? ""}`;
  const error = link
    ? s.linkGuardianForm.formState.errors.guardianId?.message
    : transfer
      ? s.transferForm.formState.errors.targetSectionId?.message
      : s.enrollForm.formState.errors.sectionId?.message;
  const sections = s.availableSections.filter(
    (section) =>
      !transfer ||
      (section.academicYearId === s.transferringEnrollment?.academicYearId &&
        section.sectionId !== s.transferringEnrollment?.sectionId),
  );
  return (
    <StudentSidePanel
      title={transfer ? "Trasladar de sección" : label}
      subtitle={subtitle}
      busy={s.isPending}
      onClose={() => s.setOpenDrawer(null)}
      onSubmit={form}
      submitLabel={label}
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
      {link ? (
        <>
          <StudentFormField id="link-guardian" label="Responsable *" error={error}>
            <select
              id="link-guardian"
              autoFocus
              disabled={s.isPending}
              aria-invalid={!!error}
              aria-describedby={error ? "link-guardian-error" : undefined}
              {...s.linkGuardianForm.register("guardianId")}
            >
              <option value="">Selecciona un responsable registrado</option>
              {s.directory.guardians
                .filter(
                  (g) => !s.selectedStudent?.guardians.some((link) => link.guardianId === g.id),
                )
                .map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.fullName} · {g.email}
                  </option>
                ))}
            </select>
          </StudentFormField>
          <StudentFormField
            id="link-relationship"
            label="Parentesco *"
            error={s.linkGuardianForm.formState.errors.relationshipType?.message}
          >
            <Input
              id="link-relationship"
              placeholder="Madre, padre, tutor…"
              disabled={s.isPending}
              aria-invalid={!!s.linkGuardianForm.formState.errors.relationshipType}
              aria-describedby={
                s.linkGuardianForm.formState.errors.relationshipType
                  ? "link-relationship-error"
                  : undefined
              }
              {...s.linkGuardianForm.register("relationshipType")}
            />
          </StudentFormField>
          <div className={styles.switches}>
            {(
              [
                {
                  name: "hasAcademicAccess",
                  label: "Acceso académico",
                  detail: "Puede ver notas y asistencia",
                },
                {
                  name: "hasFinancialResponsibility",
                  label: "Responsabilidad financiera",
                  detail: "Responde por los pagos",
                },
                {
                  name: "hasPickupAuthorization",
                  label: "Recogida autorizada",
                  detail: "Puede retirar al estudiante",
                },
              ] as const
            ).map((item) => (
              <div className={styles.switchRow} key={item.name}>
                <div className="min-w-0 flex-1">
                  <label htmlFor={item.name} className="text-school-button font-semibold">
                    {item.label}
                  </label>
                  <p
                    className="text-school-label text-school-secondary mt-0.5"
                    id={item.name + "-description"}
                  >
                    {item.detail}
                  </p>
                </div>
                <Switch
                  id={item.name}
                  aria-describedby={item.name + "-description"}
                  disabled={s.isPending}
                  {...s.linkGuardianForm.register(item.name)}
                />
              </div>
            ))}
          </div>
        </>
      ) : (
        <StudentFormField
          id="enrollment-section"
          label={transfer ? "Sección de destino *" : "Sección *"}
          error={error}
          hint={
            transfer
              ? "Solo aparecen secciones del mismo año con cupos disponibles."
              : "Solo aparecen secciones abiertas con cupos disponibles."
          }
        >
          <select
            id="enrollment-section"
            autoFocus
            disabled={s.isPending}
            aria-invalid={!!error}
            aria-describedby={error ? "enrollment-section-error" : "enrollment-section-hint"}
            {...(transfer
              ? s.transferForm.register("targetSectionId")
              : s.enrollForm.register("sectionId"))}
          >
            <option value="">Selecciona una sección con cupos</option>
            {sections.map((section) => (
              <option key={section.sectionId} value={section.sectionId}>
                {section.gradeLevelName} {section.sectionCode} · {section.academicYearCode} ·{" "}
                {section.availableSeats} cupos
              </option>
            ))}
          </select>
        </StudentFormField>
      )}
    </StudentSidePanel>
  );
}
