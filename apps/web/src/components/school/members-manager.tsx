"use client";

import { FeedbackBanner } from "@/components/shared/feedback-banner";
import { MembersTable } from "@/features/school/components/members-table";
import { useSchoolMembers } from "@/features/school/hooks/use-school-members";
import type { MemberDto, ProblemDetails } from "@/lib/api/types";

interface MembersManagerProps {
  initialMembers: MemberDto[];
  initialProblem: ProblemDetails | null;
  csrfToken: string;
  canManageMembers: boolean;
}

export function MembersManager({
  initialMembers,
  initialProblem,
  csrfToken,
  canManageMembers,
}: MembersManagerProps) {
  const {
    members,
    problem,
    successMessage,
    busyMembershipId,
    refreshing,
    refreshMembers,
    handleRevokeMember,
  } = useSchoolMembers({
    initialMembers,
    initialProblem,
    csrfToken,
  });

  return (
    <div className="space-y-6">
      <FeedbackBanner
        successTitle="Membresía actualizada"
        successMessage={successMessage}
        problem={problem}
      />

      <MembersTable
        members={members}
        refreshing={refreshing}
        busyMembershipId={busyMembershipId}
        canManageMembers={canManageMembers}
        onRefresh={refreshMembers}
        onRevokeMember={handleRevokeMember}
      />
    </div>
  );
}
