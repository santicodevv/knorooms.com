import { ActionDialog } from "@/components/shared/action-dialog";
import { Button } from "@/components/ui/button";
export function InstitutionStatusDialog({
  open,
  busy,
  name,
  active,
  onClose,
  onConfirm,
}: {
  open: boolean;
  busy: boolean;
  name: string;
  active: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <ActionDialog
      open={open}
      busy={busy}
      title={active ? "Suspender institución" : "Reactivar institución"}
      onClose={onClose}
    >
      <p className="text-xs leading-6 text-slate-500">
        {active
          ? `Se bloqueará el acceso a ${name}. Sus datos se conservarán.`
          : `Se restaurará el acceso a ${name} según sus permisos y módulos habilitados.`}
      </p>
      <div className="mt-6 flex justify-end gap-2">
        <Button variant="outline" disabled={busy} onClick={onClose}>
          Cancelar
        </Button>
        <Button variant={active ? "destructive" : "default"} disabled={busy} onClick={onConfirm}>
          {busy ? "Procesando…" : "Confirmar"}
        </Button>
      </div>
    </ActionDialog>
  );
}
