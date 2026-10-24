import { Button } from "@/components/ui/button";
import { invitationStatusLabels } from "../schemas/institution-setup-schemas";
import type { AdministratorDialogState } from "../hooks/use-administrator-dialog";
export function AdministratorInvitationStatus({
  state: s,
  active,
}: {
  state: AdministratorDialogState;
  active: boolean;
}) {
  return (
    <>
      {s.data?.administrators.map((admin) => (
        <div key={admin.userId} className="mb-3 rounded-lg bg-emerald-50 p-3 text-xs">
          <p className="font-semibold text-emerald-700">Administrador activo</p>
          <p className="mt-1">{admin.displayName}</p>
          <p className="mt-1 break-all text-slate-500">{admin.email}</p>
        </div>
      ))}
      <div className="mb-4 space-y-2">
        {s.pendingInvitations.map((inv) => (
          <div key={inv.id} className="border-divider rounded-[9px] border p-3 text-[11px]">
            <p className="font-semibold break-all">{inv.email}</p>
            <p className="text-muted mt-1">
              {inv.status === "Expired"
                ? "Invitación vencida"
                : inv.deliveryStatus === "Failed"
                  ? "Envío fallido"
                  : `${invitationStatusLabels[inv.deliveryStatus]} · Invitación pendiente`}
            </p>
            <p className="text-muted mt-1">
              Vence:{" "}
              {new Date(inv.expiresAt).toLocaleString("es-DO", {
                timeZone: "America/Santo_Domingo",
              })}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={s.busy || !active}
                onClick={() =>
                  s.setConfirmation({ id: inv.id, email: inv.email, action: "resend" })
                }
              >
                Reenviar
              </Button>
              <Button
                size="sm"
                variant="ghost"
                disabled={s.busy}
                onClick={() =>
                  s.setConfirmation({ id: inv.id, email: inv.email, action: "revoke" })
                }
              >
                Revocar
              </Button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
