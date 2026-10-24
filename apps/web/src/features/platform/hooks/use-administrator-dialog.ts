"use client";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import {
  getInstitutionSetup,
  inviteAdministrator,
  revokeAdministratorInvitation,
} from "../api/institution-setup-api";
import { resendAdministratorInvitation } from "../api/institution-management-api";
import { invitationEmailSchema, type InstitutionSetup } from "../schemas/institution-setup-schemas";
import type { ApiResult, ProblemDetails } from "@/lib/api/types";
export function useAdministratorDialog(id: string, csrfToken: string, onChanged: () => void) {
  const [data, setData] = useState<InstitutionSetup | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<ProblemDetails | null>(null);
  const [confirmation, setConfirmation] = useState<{
    id: string;
    email: string;
    action: "resend" | "revoke";
  } | null>(null);
  const form = useForm<{ email: string }>({
    resolver: zodResolver(invitationEmailSchema),
    defaultValues: { email: "" },
  });
  useEffect(() => {
    let ignore = false;
    getInstitutionSetup(id).then((result) => {
      if (ignore) return;
      if (result.ok) setData(result.data);
      else setProblem(result.problem);
      setLoading(false);
    });
    return () => {
      ignore = true;
    };
  }, [id]);
  async function refresh() {
    const result = await getInstitutionSetup(id);
    if (result.ok) {
      setData(result.data);
      setProblem(null);
    } else setProblem(result.problem);
    onChanged();
  }
  async function run(operation: () => Promise<ApiResult<unknown>>, message: string) {
    setBusy(true);
    setProblem(null);
    const toastId = toast.loading("Procesando invitación…");
    try {
      const result = await operation();
      if (!result.ok) {
        setProblem(result.problem);
        toast.error(result.problem.detail ?? "No se pudo completar la invitación.", {
          id: toastId,
        });
        await refresh();
        return;
      }
      toast.success(message, { id: toastId });
      setConfirmation(null);
      form.reset();
      await refresh();
    } finally {
      setBusy(false);
    }
  }
  return {
    data,
    pendingInvitations:
      data?.invitations.filter((inv) => inv.status === "Pending" || inv.status === "Expired") ?? [],
    loading,
    busy,
    problem,
    form,
    confirmation,
    setConfirmation,
    refresh,
    send: form.handleSubmit((values) =>
      run(
        () => inviteAdministrator(id, values.email, csrfToken),
        `Invitación para ${values.email} en cola de envío.`,
      ),
    ),
    confirm: () =>
      confirmation
        ? run(
            () =>
              confirmation.action === "resend"
                ? resendAdministratorInvitation(id, confirmation.id, csrfToken)
                : revokeAdministratorInvitation(id, confirmation.id, csrfToken),
            confirmation.action === "resend"
              ? "Nuevo enlace en cola. El enlace anterior quedó invalidado."
              : "Invitación revocada.",
          )
        : Promise.resolve(),
  };
}

export type AdministratorDialogState = ReturnType<typeof useAdministratorDialog>;
