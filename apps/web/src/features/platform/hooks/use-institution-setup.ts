"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { ProblemDetails, ApiResult } from "@/lib/api/types";
import {
  getInstitutionSetup,
  updateInstitutionProfile,
  inviteAdministrator,
  revokeAdministratorInvitation,
} from "../api/institution-setup-api";
import {
  institutionProfileSchema,
  invitationEmailSchema,
  type InstitutionSetup,
  type InstitutionProfileValues,
} from "../schemas/institution-setup-schemas";

export function useInstitutionSetup(initial: InstitutionSetup, csrfToken: string) {
  const [data, setData] = useState(initial);
  const [problem, setProblem] = useState<ProblemDetails | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const profileForm = useForm<InstitutionProfileValues>({
    resolver: zodResolver(institutionProfileSchema),
    defaultValues: initial.profile,
  });
  const inviteForm = useForm<{ email: string }>({
    resolver: zodResolver(invitationEmailSchema),
    defaultValues: { email: "" },
  });
  async function reload(resetProfile = false) {
    const response = await getInstitutionSetup(data.profile.id);
    if (!response.ok) {
      setProblem(response.problem);
      return;
    }
    setData(response.data);
    if (resetProfile) profileForm.reset(response.data.profile);
  }
  async function run<T>(
    operation: () => Promise<ApiResult<T>>,
    message: string,
    resetProfile = false,
  ) {
    setBusy(true);
    setProblem(null);
    setSuccess(null);
    try {
      const response = await operation();
      if (!response.ok) {
        setProblem(response.problem);
        return;
      }
      setSuccess(message);
      await reload(resetProfile);
    } finally {
      setBusy(false);
    }
  }
  return {
    data,
    problem,
    success,
    busy,
    profileForm,
    inviteForm,
    save: profileForm.handleSubmit((values) =>
      run(
        () => updateInstitutionProfile(data.profile.id, values, csrfToken),
        "Ficha guardada.",
        true,
      ),
    ),
    invite: inviteForm.handleSubmit((values) =>
      run(
        () => inviteAdministrator(data.profile.id, values.email, csrfToken),
        "Invitación en cola de envío. Actualice para consultar su estado.",
      ),
    ),
    revoke: (id: string) =>
      run(
        () => revokeAdministratorInvitation(data.profile.id, id, csrfToken),
        "Invitación revocada.",
      ),
    refresh: () => run(() => getInstitutionSetup(data.profile.id), "Estado actualizado."),
  };
}
