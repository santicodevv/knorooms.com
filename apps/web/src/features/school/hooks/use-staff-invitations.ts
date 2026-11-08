"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  createStaffInvitation,
  fetchStaffInvitations,
  resendStaffInvitation,
  revokeStaffInvitation,
} from "@/features/school/api/school-api";
import { staffInvitationSchema } from "@/features/school/schemas/staff-invitation-schemas";
import type { InstitutionStaffInvitationDto, ProblemDetails } from "@/lib/api/types";

export function useStaffInvitations(
  initialInvitations: InstitutionStaffInvitationDto[],
  initialProblem: ProblemDetails | null,
  csrfToken: string,
) {
  const router = useRouter();
  const [invitations, setInvitations] = useState(initialInvitations);
  const [problem, setProblem] = useState<ProblemDetails | null>(initialProblem);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  async function refresh() {
    setRefreshing(true);
    setProblem(null);
    const result = await fetchStaffInvitations();
    setRefreshing(false);

    if (result.ok) {
      setInvitations(result.data);
    } else {
      setProblem(result.problem);
    }
  }

  async function create(email: string, roleIds: string[]) {
    const parsed = staffInvitationSchema.safeParse({ email: email.trim(), roleIds });
    if (!parsed.success) {
      setProblem({
        title: parsed.error.issues[0]?.message ?? "Revisa los datos de la invitación.",
        status: 400,
      });
      return false;
    }

    setCreating(true);
    setProblem(null);
    const result = await createStaffInvitation(parsed.data, csrfToken);
    setCreating(false);

    if (!result.ok) {
      setProblem(result.problem);
      return false;
    }

    setInvitations((current) => [result.data, ...current.filter((item) => item.id !== result.data.id)]);
    toast.success("Invitación creada y añadida a la cola de envío.");
    router.refresh();
    return true;
  }

  async function resend(invitation: InstitutionStaffInvitationDto) {
    setBusyId(invitation.id);
    setProblem(null);
    const result = await resendStaffInvitation(invitation.id, csrfToken);
    setBusyId(null);

    if (!result.ok) {
      setProblem(result.problem);
      return;
    }

    toast.success("Se solicitó reenviar la invitación.");
    await refresh();
  }

  async function revoke(invitation: InstitutionStaffInvitationDto) {
    if (!window.confirm(`¿Revocar la invitación para ${invitation.email}?`)) return;

    setBusyId(invitation.id);
    setProblem(null);
    const result = await revokeStaffInvitation(invitation.id, csrfToken);
    setBusyId(null);

    if (!result.ok) {
      setProblem(result.problem);
      return;
    }

    setInvitations((current) =>
      current.map((item) =>
        item.id === invitation.id
          ? { ...item, revokedAtUtc: new Date().toISOString() }
          : item,
      ),
    );
    toast.success("Invitación revocada.");
    router.refresh();
  }

  return { invitations, problem, busyId, creating, refreshing, create, resend, revoke, refresh };
}
