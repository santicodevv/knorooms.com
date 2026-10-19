"use client";

import { FeedbackBanner } from "@/components/shared/feedback-banner";
import { SupportGrantsTable } from "@/features/school/components/support-grants-table";
import { useSupportAccessGrants } from "@/features/school/hooks/use-support-access-grants";
import type { ProblemDetails, SupportAccessGrantDto } from "@/lib/api/types";

interface SupportAccessManagerProps {
  initialGrants: SupportAccessGrantDto[];
  initialProblem: ProblemDetails | null;
  csrfToken: string;
  canManageSupportAccess: boolean;
}

export function SupportAccessManager({
  initialGrants,
  initialProblem,
  csrfToken,
  canManageSupportAccess,
}: SupportAccessManagerProps) {
  const {
    grants,
    problem,
    successMessage,
    busyGrantId,
    refreshing,
    refreshGrants,
    handleGrantAction,
  } = useSupportAccessGrants({
    initialGrants,
    initialProblem,
    csrfToken,
  });

  return (
    <div className="space-y-6">
      <FeedbackBanner
        successTitle="Control de acceso actualizado"
        successMessage={successMessage}
        problem={problem}
      />

      <SupportGrantsTable
        grants={grants}
        refreshing={refreshing}
        busyGrantId={busyGrantId}
        canManageSupportAccess={canManageSupportAccess}
        onRefresh={refreshGrants}
        onGrantAction={handleGrantAction}
      />
    </div>
  );
}
