"use client";
import { RefreshCw } from "lucide-react";
import { ActionDialog } from "@/components/shared/action-dialog";
import { ProblemAlert } from "@/components/api/problem-alert";
import { Button } from "@/components/ui/button";
import { AdministratorInvitationStatus } from "./administrator-invitation-status";
import { AdministratorInvitationForm } from "./administrator-invitation-form";
import { AdministratorInvitationConfirmation } from "./administrator-invitation-confirmation";
import { useAdministratorDialog } from "../hooks/use-administrator-dialog";
export function AdministratorInvitationDialog({
  institution,
  csrfToken,
  onClose,
  onChanged,
}: {
  institution: { id: string; name: string; slug: string; status: string };
  csrfToken: string;
  onClose: () => void;
  onChanged: () => void;
}) {
  const s = useAdministratorDialog(institution.id, csrfToken, onChanged);
  return (
    <ActionDialog open title="Invitar administrador" busy={s.busy} onClose={onClose}>
      <p className="text-muted mb-4 text-[11px] leading-5">
        Se enviará una invitación para administrar este colegio.
      </p>
      <div className="mb-5 rounded-[9px] border border-[#e6edf8] bg-[#f8faff] p-3.5">
        <p className="text-xs font-semibold">{institution.name}</p>
        <p className="text-muted mt-1 text-[11px]">{institution.slug} · Institución seleccionada</p>
      </div>
      {s.problem ? (
        <div className="mb-4">
          <ProblemAlert problem={s.problem} />
        </div>
      ) : null}
      {s.loading ? (
        <p role="status" className="text-muted py-6 text-xs">
          Consultando administrador e invitaciones…
        </p>
      ) : (
        <>
          <AdministratorInvitationStatus state={s} active={institution.status === "Active"} />
          <AdministratorInvitationForm
            state={s}
            active={institution.status === "Active"}
            onClose={onClose}
          />
          <Button className="mt-3" size="sm" variant="ghost" disabled={s.busy} onClick={s.refresh}>
            <RefreshCw />
            Actualizar estado
          </Button>
        </>
      )}
      <AdministratorInvitationConfirmation state={s} />
    </ActionDialog>
  );
}
