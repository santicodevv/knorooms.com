"use client";

import { FeedbackBanner } from "@/components/shared/feedback-banner";
import { AssignAdminFormCard } from "@/features/platform/components/assign-admin-form-card";
import { CreateInstitutionFormCard } from "@/features/platform/components/create-institution-form-card";
import { InstitutionsTable } from "@/features/platform/components/institutions-table";
import { RequestSupportAccessFormCard } from "@/features/platform/components/request-support-access-form-card";
import { usePlatformConsole } from "@/features/platform/hooks/use-platform-console";
import type { InstitutionDto, ProblemDetails } from "@/lib/api/types";

interface PlatformConsoleProps {
  initialInstitutions: InstitutionDto[];
  initialProblem: ProblemDetails | null;
  csrfToken: string;
  baseDomain: string;
  portSuffix: string;
  proto: string;
}

export function PlatformConsole({
  initialInstitutions,
  initialProblem,
  csrfToken,
  baseDomain,
  portSuffix,
  proto,
}: PlatformConsoleProps) {
  const {
    institutions,
    listProblem,
    actionProblem,
    actionSuccess,
    busyInstitutionId,
    refreshingList,
    createForm,
    assignAdminForm,
    supportForm,
    selectedPermissions,
    refreshInstitutions,
    onCreateInstitution,
    handleToggleInstitutionStatus,
    onAssignAdministrator,
    onRequestSupportAccess,
    togglePermissionSelection,
  } = usePlatformConsole({
    initialInstitutions,
    initialProblem,
    csrfToken,
  });

  return (
    <div className="space-y-8">
      <FeedbackBanner
        successTitle="Operación completada"
        successMessage={actionSuccess}
        problem={actionProblem}
      />

      <InstitutionsTable
        institutions={institutions}
        listProblem={listProblem}
        refreshing={refreshingList}
        busyInstitutionId={busyInstitutionId}
        baseDomain={baseDomain}
        portSuffix={portSuffix}
        proto={proto}
        onRefresh={refreshInstitutions}
        onToggleStatus={handleToggleInstitutionStatus}
      />

      <div id="support-access" className="grid gap-6 lg:grid-cols-3">
        <CreateInstitutionFormCard
          form={createForm}
          baseDomain={baseDomain}
          onSubmit={onCreateInstitution}
        />

        <AssignAdminFormCard
          form={assignAdminForm}
          institutions={institutions}
          onSubmit={onAssignAdministrator}
        />

        <RequestSupportAccessFormCard
          form={supportForm}
          institutions={institutions}
          selectedPermissions={selectedPermissions}
          onTogglePermission={togglePermissionSelection}
          onSubmit={onRequestSupportAccess}
        />
      </div>
    </div>
  );
}
