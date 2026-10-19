"use client";

import { AlertCircle, CheckCircle2 } from "lucide-react";
import { ProblemAlert } from "@/components/api/problem-alert";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { EnrollmentsCapacityPanel } from "@/features/school/students/components/enrollments-capacity-panel";
import { GuardiansDirectoryPanel } from "@/features/school/students/components/guardians-directory-panel";
import { StudentDirectorySplitView } from "@/features/school/students/components/student-directory-split-view";
import { StudentsContextStrip } from "@/features/school/students/components/students-context-strip";
import { useStudentsWorkspace } from "@/features/school/students/hooks/use-students-workspace";
import type {
  EnrollmentsOverviewDto,
  ProblemDetails,
  StudentDirectoryOverviewDto,
} from "@/lib/api/types";

interface StudentsWorkspaceProps {
  initialDirectory: StudentDirectoryOverviewDto;
  initialEnrollments: EnrollmentsOverviewDto;
  initialProblem: ProblemDetails | null;
  csrfToken: string;
  canManageStudents: boolean;
  canManageEnrollments: boolean;
}

export function StudentsWorkspace({
  initialDirectory,
  initialEnrollments,
  initialProblem,
  csrfToken,
  canManageStudents,
  canManageEnrollments,
}: StudentsWorkspaceProps) {
  const {
    directory,
    enrollmentsOverview,
    availableSections,
    problem,
    feedback,
    activeView,
    setActiveView,
    openDrawer,
    setOpenDrawer,
    toggleDrawer,
    selectedStudent,
    setSelectedStudentId,
    studentSearchQuery,
    setStudentSearchQuery,
    studentStatusFilter,
    setStudentStatusFilter,
    filteredStudents,
    selectedSectionFilterId,
    setSelectedSectionFilterId,
    filteredEnrollments,
    transferringEnrollment,
    setTransferringEnrollment,
    openQuickEnrollForStudent,
    openTransferForEnrollment,
    metrics,
    isPending,
    actionLoadingId,
    handleRefresh,
    handleToggleStudentActive,
    handleWithdrawEnrollment,
    studentForm,
    submitCreateStudent,
    guardianForm,
    submitCreateGuardian,
    linkGuardianForm,
    submitLinkGuardian,
    enrollForm,
    submitEnrollStudent,
    transferForm,
    submitTransferSection,
  } = useStudentsWorkspace({
    initialDirectory,
    initialEnrollments,
    initialProblem,
    csrfToken,
  });

  return (
    <div className="space-y-5">
      <StudentsContextStrip
        activeView={activeView}
        onSelectView={setActiveView}
        totalStudents={metrics.totalStudents}
        activeStudents={metrics.activeStudents}
        sigerdCount={metrics.sigerdCount}
        guardiansCount={metrics.guardiansCount}
        activeEnrollments={metrics.activeEnrollments}
        totalCapacity={metrics.totalCapacity}
        totalAvailableSeats={metrics.totalAvailableSeats}
        isRefreshing={isPending}
        onRefresh={handleRefresh}
      />

      {problem ? <ProblemAlert problem={problem} /> : null}

      {feedback ? (
        <div className="animate-slide-down">
          <Alert variant={feedback.tone === "error" ? "destructive" : "info"}>
            {feedback.tone === "error" ? (
              <AlertCircle className="size-4" />
            ) : (
              <CheckCircle2 className="size-4" />
            )}
            <AlertTitle>{feedback.title}</AlertTitle>
            {feedback.detail ? <AlertDescription>{feedback.detail}</AlertDescription> : null}
          </Alert>
        </div>
      ) : null}

      {activeView === "directory" ? (
        <StudentDirectorySplitView
          students={filteredStudents}
          totalStudentsCount={directory.students.length}
          selectedStudent={selectedStudent}
          onSelectStudent={setSelectedStudentId}
          searchQuery={studentSearchQuery}
          onChangeSearchQuery={setStudentSearchQuery}
          statusFilter={studentStatusFilter}
          onChangeStatusFilter={setStudentStatusFilter}
          guardians={directory.guardians}
          availableSections={availableSections}
          canManageStudents={canManageStudents}
          canManageEnrollments={canManageEnrollments}
          openDrawer={openDrawer}
          onToggleDrawer={toggleDrawer}
          onOpenQuickEnroll={openQuickEnrollForStudent}
          onToggleStudentActive={handleToggleStudentActive}
          studentForm={studentForm}
          onSubmitStudent={submitCreateStudent}
          linkGuardianForm={linkGuardianForm}
          onSubmitLinkGuardian={submitLinkGuardian}
          enrollForm={enrollForm}
          onSubmitEnroll={submitEnrollStudent}
          actionLoadingId={actionLoadingId}
          isSubmitting={isPending}
        />
      ) : null}

      {activeView === "enrollments" ? (
        <EnrollmentsCapacityPanel
          enrollments={filteredEnrollments}
          sectionCapacities={enrollmentsOverview.sectionCapacities}
          selectedSectionFilterId={selectedSectionFilterId}
          onSelectSectionFilter={setSelectedSectionFilterId}
          canManageEnrollments={canManageEnrollments}
          openDrawer={openDrawer}
          transferringEnrollment={transferringEnrollment}
          onOpenTransfer={openTransferForEnrollment}
          onCloseTransfer={() => {
            setTransferringEnrollment(null);
            setOpenDrawer(null);
          }}
          transferForm={transferForm}
          onSubmitTransfer={submitTransferSection}
          onWithdrawEnrollment={handleWithdrawEnrollment}
          actionLoadingId={actionLoadingId}
          isSubmitting={isPending}
        />
      ) : null}

      {activeView === "guardians" ? (
        <GuardiansDirectoryPanel
          guardians={directory.guardians}
          canManageStudents={canManageStudents}
          openDrawer={openDrawer}
          onToggleDrawer={toggleDrawer}
          guardianForm={guardianForm}
          onSubmitGuardian={submitCreateGuardian}
          isSubmitting={isPending}
        />
      ) : null}
    </div>
  );
}
