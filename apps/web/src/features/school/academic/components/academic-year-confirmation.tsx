import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ProblemAlert } from "@/components/api/problem-alert";
import { useSchoolDialog } from "../../hooks/use-school-dialog";
import type { AcademicState } from "../hooks/use-academic-workspace";
export function AcademicYearConfirmation({ state: s }: { state: AcademicState }) {
  const ref = useSchoolDialog(true);
  const action = s.confirmation;
  if (!action) return null;
  const label = action.closed ? "Reabrir año escolar" : "Cerrar año escolar";
  return (
    <Dialog
      ref={ref}
      aria-labelledby="academic-confirm-title"
      aria-describedby="academic-confirm-description"
      onCancel={(event) => {
        event.preventDefault();
        s.closeConfirmation();
      }}
    >
      <div className="space-y-5">
        <h2 className="text-school-section" id="academic-confirm-title">
          {label} {action.code}
        </h2>
        <p
          className="text-school-button text-school-secondary leading-5.5"
          id="academic-confirm-description"
        >
          {action.closed
            ? "Se habilitarán nuevamente las nuevas secciones, asignaciones docentes y matrículas en este año escolar."
            : "No podrás crear nuevas secciones, asignaciones docentes ni matrículas en este año. La estructura y el historial se conservan y podrás volver a abrirlo."}
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
          <Button disabled={s.isPending} onClick={s.confirmYearStatus}>
            {s.isPending ? "Guardando…" : label}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
