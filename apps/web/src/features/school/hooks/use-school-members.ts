"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { fetchSchoolMembers, revokeSchoolMember } from "@/features/school/api/school-api";
import type { MemberDto, ProblemDetails } from "@/lib/api/types";

interface UseSchoolMembersParams {
  initialMembers: MemberDto[];
  initialProblem: ProblemDetails | null;
  csrfToken: string;
}

export function useSchoolMembers({
  initialMembers,
  initialProblem,
  csrfToken,
}: UseSchoolMembersParams) {
  const router = useRouter();
  const [members, setMembers] = useState<MemberDto[]>(initialMembers);
  const [problem, setProblem] = useState<ProblemDetails | null>(initialProblem);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [busyMembershipId, setBusyMembershipId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  async function refreshMembers() {
    setRefreshing(true);
    setProblem(null);
    const result = await fetchSchoolMembers();
    setRefreshing(false);

    if (result.ok) {
      setMembers(result.data);
      router.refresh();
    } else {
      setProblem(result.problem);
    }
  }

  async function handleRevokeMember(member: MemberDto) {
    setProblem(null);
    setSuccessMessage(null);
    setBusyMembershipId(member.membershipId);

    const result = await revokeSchoolMember(member.membershipId, csrfToken);
    setBusyMembershipId(null);

    if (!result.ok) {
      setProblem(result.problem);
      return;
    }

    setMembers((prev) =>
      prev.map((item) =>
        item.membershipId === member.membershipId ? { ...item, status: "Revoked" } : item,
      ),
    );
    setSuccessMessage(
      `La membresía de "${member.displayName}" (${member.email}) fue revocada exitosamente.`,
    );
    router.refresh();
  }

  return {
    members,
    problem,
    successMessage,
    busyMembershipId,
    refreshing,
    refreshMembers,
    handleRevokeMember,
  };
}
