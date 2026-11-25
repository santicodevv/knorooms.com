import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ProblemAlert } from "@/components/api/problem-alert";
import { useStudentOverlay } from "../hooks/use-student-overlay";
import type { ReturnTypeOfStudents } from "../hooks/use-students-workspace";

export function StudentConfirmation({ state: s }: { state: ReturnTypeOfStudents }) {
  const ref = useStudentOverlay(true);
  const action = s.confirmation;
  if (!action) return null;
  const withdraw = action.kind === "withdraw";
  const label = withdraw
    ? "Retirar matrícula"
    : action.active
      ? "Desactivar expediente"
      : "Activar expediente";
  return (
    <Dialog
      ref={ref}
      aria-labelledby="student-confirm-title"
      aria-describedby="student-confirm-detail"
      onCancel={(e) => {
        e.preventDefault();
        s.closeConfirmation();
      }}
    >
      <div className="space-y-5">
        <h2 id="student-confirm-title" className="text-school-section">
          {label}
        </h2>
        <p className="text-school-body font-semibold">
          {action.name}
          {s.confirmationContext ? ` · ${s.confirmationContext}` : ""}
        </p>
        <p
          id="student-confirm-detail"
          className="text-school-button text-school-secondary leading-5.5"
        >
          {withdraw
            ? "El estudiante dejará de aparecer al pasar lista y registrar notas en esta sección. El historial de la matrícula se conserva."
            : action.active
              ? "El expediente se conservará con sus responsables e historial. Mientras esté inactivo, no podrás registrar nuevas matrículas."
              : "El expediente volverá a estar habilitado para registrar nuevas matrículas."}
        </p>
        {s.feedback?.tone === "error" && (
          <ProblemAlert
            problem={{
              title: s.feedback.title,
              status: s.feedback.status ?? 500,
              detail: s.feedback.detail,
            }}
          />
        )}
        <div className="flex justify-end gap-3">
          <Button variant="outline" disabled={s.isPending} onClick={s.closeConfirmation}>
            Cancelar
          </Button>
          <Button
            variant={withdraw ? "destructive" : "default"}
            disabled={s.isPending}
            onClick={s.confirmAction}
          >
            {s.isPending ? "Guardando…" : label}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
