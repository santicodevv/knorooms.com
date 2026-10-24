import { ActionDialog } from "@/components/shared/action-dialog";
import { Button } from "@/components/ui/button";
import { SchoolField, schoolSelectClass } from "../../components/school-ui";
import { Input } from "@/components/ui/input";
import type { ReturnTypeOfStudents } from "../hooks/use-students-workspace";
export function StudentActionDialog({ state: s }: { state: ReturnTypeOfStudents }) {
  const action = s.openDrawer;
  if (!["link-guardian", "enroll", "transfer"].includes(action ?? "")) return null;
  const form =
    action === "link-guardian"
      ? s.submitLinkGuardian
      : action === "transfer"
        ? s.submitTransferSection
        : s.submitEnrollStudent;
  return (
    <ActionDialog
      open
      title={
        action === "link-guardian"
          ? "Vincular responsable"
          : action === "transfer"
            ? "Trasladar matrícula"
            : "Matricular estudiante"
      }
      busy={s.isPending}
      onClose={() => s.setOpenDrawer(null)}
    >
      <form onSubmit={form} noValidate className="space-y-5">
        <p className="text-muted text-xs">
          {action === "transfer"
            ? s.transferringEnrollment?.studentFullName
            : s.selectedStudent?.fullName}
        </p>
        {action === "link-guardian" ? (
          <>
            <SchoolField
              label="Responsable *"
              error={s.linkGuardianForm.formState.errors.guardianId?.message}
            >
              <select className={schoolSelectClass} {...s.linkGuardianForm.register("guardianId")}>
                <option value="">Seleccionar responsable</option>
                {s.directory.guardians.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.fullName}
                  </option>
                ))}
              </select>
            </SchoolField>
            <SchoolField
              label="Parentesco *"
              error={s.linkGuardianForm.formState.errors.relationshipType?.message}
            >
              <Input
                placeholder="Madre, padre, tutor…"
                {...s.linkGuardianForm.register("relationshipType")}
              />
            </SchoolField>
            {(
              [
                { key: "hasAcademicAccess", label: "Acceso académico" },
                { key: "hasFinancialResponsibility", label: "Responsabilidad financiera" },
                { key: "hasPickupAuthorization", label: "Autorización de recogida" },
              ] as const
            ).map((i) => (
              <label key={i.key} className="flex items-center gap-3 text-xs text-slate-700">
                <input
                  type="checkbox"
                  className="size-4 accent-blue-600"
                  {...s.linkGuardianForm.register(i.key)}
                />
                {i.label}
              </label>
            ))}
          </>
        ) : action === "transfer" ? (
          <SchoolField
            label="Sección de destino *"
            error={s.transferForm.formState.errors.targetSectionId?.message}
          >
            <select className={schoolSelectClass} {...s.transferForm.register("targetSectionId")}>
              <option value="">Seleccionar sección</option>
              {s.availableSections
                .filter(
                  (sec) =>
                    sec.academicYearId === s.transferringEnrollment?.academicYearId &&
                    sec.sectionId !== s.transferringEnrollment.sectionId,
                )
                .map((sec) => (
                  <option key={sec.sectionId} value={sec.sectionId}>
                    {sec.academicYearCode} · {sec.gradeLevelName} {sec.sectionCode} ·{" "}
                    {sec.availableSeats} cupos
                  </option>
                ))}
            </select>
          </SchoolField>
        ) : (
          <>
            <input type="hidden" {...s.enrollForm.register("studentId")} />
            <SchoolField
              label="Sección con cupos *"
              error={s.enrollForm.formState.errors.sectionId?.message}
            >
              <select className={schoolSelectClass} {...s.enrollForm.register("sectionId")}>
                <option value="">Seleccionar sección</option>
                {s.availableSections.map((sec) => (
                  <option key={sec.sectionId} value={sec.sectionId}>
                    {sec.academicYearCode} · {sec.gradeLevelName} {sec.sectionCode} ·{" "}
                    {sec.availableSeats} cupos
                  </option>
                ))}
              </select>
            </SchoolField>
          </>
        )}
        <div className="flex justify-end gap-2">
          <Button variant="outline" disabled={s.isPending} onClick={() => s.setOpenDrawer(null)}>
            Cancelar
          </Button>
          <Button type="submit" disabled={s.isPending}>
            {s.isPending ? "Guardando…" : "Confirmar"}
          </Button>
        </div>
      </form>
    </ActionDialog>
  );
}
