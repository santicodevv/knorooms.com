import { ActionDialog } from "@/components/shared/action-dialog";
import { Button } from "@/components/ui/button";
import type { AdministratorDialogState } from "../hooks/use-administrator-dialog";
export function AdministratorInvitationConfirmation({
  state: s,
}: {
  state: AdministratorDialogState;
}) {
  return (
    <ActionDialog
      open={s.confirmation !== null}
      title={s.confirmation?.action === "resend" ? "Reenviar invitación" : "Revocar invitación"}
      busy={s.busy}
      onClose={() => s.setConfirmation(null)}
    >
      <p className="text-xs leading-6 text-slate-500">
        {s.confirmation?.action === "resend"
          ? `Se enviará un nuevo enlace a ${s.confirmation.email}. El enlace anterior quedará invalidado.`
          : `Se invalidará la invitación de ${s.confirmation?.email}.`}
      </p>
      <div className="mt-6 flex justify-end gap-2">
        <Button variant="outline" disabled={s.busy} onClick={() => s.setConfirmation(null)}>
          Cancelar
        </Button>
        <Button disabled={s.busy} onClick={s.confirm}>
          Confirmar
        </Button>
      </div>
    </ActionDialog>
  );
}
