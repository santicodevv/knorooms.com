"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  executeSchoolSupportGrantAction,
  fetchSchoolSupportAccessGrants,
  type SupportGrantAction,
} from "@/features/school/api/school-api";
import type { ProblemDetails, SupportAccessGrantDto } from "@/lib/api/types";

interface UseSupportAccessGrantsParams {
  initialGrants: SupportAccessGrantDto[];
  initialProblem: ProblemDetails | null;
  csrfToken: string;
}

export function useSupportAccessGrants({
  initialGrants,
  initialProblem,
  csrfToken,
}: UseSupportAccessGrantsParams) {
  const router = useRouter();
  const [grants, setGrants] = useState<SupportAccessGrantDto[]>(initialGrants);
  const [problem, setProblem] = useState<ProblemDetails | null>(initialProblem);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [busyGrantId, setBusyGrantId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  async function refreshGrants() {
    setRefreshing(true);
    setProblem(null);
    const result = await fetchSchoolSupportAccessGrants();
    setRefreshing(false);

    if (result.ok) {
      setGrants(result.data);
      router.refresh();
    } else {
      setProblem(result.problem);
    }
  }

  async function handleGrantAction(grant: SupportAccessGrantDto, action: SupportGrantAction) {
    setProblem(null);
    setSuccessMessage(null);
    setBusyGrantId(grant.id);

    const result = await executeSchoolSupportGrantAction(grant.id, action, csrfToken);
    setBusyGrantId(null);

    if (!result.ok) {
      setProblem(result.problem);
      return;
    }

    const nowIso = new Date().toISOString();
    setGrants((prev) =>
      prev.map((item) => {
        if (item.id !== grant.id) {
          return item;
        }
        if (action === "approve") {
          return {
            ...item,
            status: "Approved",
            approvedAt: nowIso,
          };
        }
        if (action === "reject") {
          return {
            ...item,
            status: "Rejected",
          };
        }
        return {
          ...item,
          status: "Revoked",
          revokedAt: nowIso,
        };
      }),
    );

    const labels: Record<SupportGrantAction, string> = {
      approve: `La solicitud de soporte (${grant.id}) fue aprobada.`,
      reject: `La solicitud de soporte (${grant.id}) fue rechazada.`,
      revoke: `El acceso temporal de soporte (${grant.id}) fue revocado inmediatamente.`,
    };
    setSuccessMessage(labels[action]);
    router.refresh();
  }

  return {
    grants,
    problem,
    successMessage,
    busyGrantId,
    refreshing,
    refreshGrants,
    handleGrantAction,
  };
}
