"use client";

import { AlertCircle, CheckCircle2 } from "lucide-react";
import { ProblemAlert } from "@/components/api/problem-alert";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AcademicContextStrip } from "@/features/school/academic/components/academic-context-strip";
import { AcademicYearsPanel } from "@/features/school/academic/components/academic-years-panel";
import { CurriculumSubjectsPanel } from "@/features/school/academic/components/curriculum-subjects-panel";
import { GradesSectionsSplitView } from "@/features/school/academic/components/grades-sections-split-view";
import { TeacherAssignmentsPanel } from "@/features/school/academic/components/teacher-assignments-panel";
import { useAcademicWorkspace } from "@/features/school/academic/hooks/use-academic-workspace";
import type { AcademicStructureOverviewDto, MemberDto, ProblemDetails } from "@/lib/api/types";

interface AcademicWorkspaceProps {
  initialOverview: AcademicStructureOverviewDto;
  initialProblem: ProblemDetails | null;
  members: MemberDto[];
  csrfToken: string;
  canManageAcademic: boolean;
}

export function AcademicWorkspace({
  initialOverview,
  initialProblem,
  members,
  csrfToken,
  canManageAcademic,
}: AcademicWorkspaceProps) {
  const {
    overview,
    problem,
    feedback,
    activeView,
    setActiveView,
    openDrawer,
    toggleDrawer,
    selectedAcademicYearId,
    setSelectedAcademicYearId,
    selectedGradeLevelId,
    setSelectedGradeLevelId,
    subjectSearchQuery,
    setSubjectSearchQuery,
    activeAcademicYear,
    filteredSections,
    filteredAssignments,
    filteredSubjects,
    totalSeatCapacity,
    totalWeeklyHoursAssigned,
    isPending,
    actionLoadingId,
    handleRefresh,
    handleToggleYearStatus,
    yearForm,
    submitCreateYear,
    gradeForm,
    submitCreateGradeLevel,
    sectionForm,
    submitCreateSection,
    subjectForm,
    submitCreateSubject,
    assignmentForm,
    submitAssignTeacher,
  } = useAcademicWorkspace({
    initialOverview,
    initialProblem,
    csrfToken,
  });

  return (
    <div className="space-y-5">
      <AcademicContextStrip
        academicYears={overview.academicYears}
        activeAcademicYear={activeAcademicYear}
        selectedAcademicYearId={selectedAcademicYearId}
        onSelectAcademicYear={setSelectedAcademicYearId}
        activeView={activeView}
        onSelectView={setActiveView}
        gradesCount={overview.gradeLevels.length}
        sectionsCount={filteredSections.length}
        totalSeatCapacity={totalSeatCapacity}
        subjectsCount={overview.subjects.length}
        assignmentsCount={filteredAssignments.length}
        totalWeeklyHours={totalWeeklyHoursAssigned}
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

      {activeView === "grades-sections" ? (
        <GradesSectionsSplitView
          gradeLevels={overview.gradeLevels}
          academicYears={overview.academicYears}
          filteredSections={filteredSections}
          selectedGradeLevelId={selectedGradeLevelId}
          onSelectGradeLevel={setSelectedGradeLevelId}
          canManageAcademic={canManageAcademic}
          openDrawer={openDrawer}
          onToggleDrawer={toggleDrawer}
          gradeForm={gradeForm}
          onSubmitGradeLevel={submitCreateGradeLevel}
          sectionForm={sectionForm}
          onSubmitSection={submitCreateSection}
          isSubmitting={isPending}
        />
      ) : null}

      {activeView === "years" ? (
        <AcademicYearsPanel
          academicYears={overview.academicYears}
          canManageAcademic={canManageAcademic}
          openDrawer={openDrawer}
          onToggleDrawer={toggleDrawer}
          yearForm={yearForm}
          onSubmitYear={submitCreateYear}
          onToggleYearStatus={handleToggleYearStatus}
          actionLoadingId={actionLoadingId}
          isSubmitting={isPending}
        />
      ) : null}

      {activeView === "subjects" ? (
        <CurriculumSubjectsPanel
          subjects={filteredSubjects}
          totalSubjectsCount={overview.subjects.length}
          searchQuery={subjectSearchQuery}
          onChangeSearchQuery={setSubjectSearchQuery}
          canManageAcademic={canManageAcademic}
          openDrawer={openDrawer}
          onToggleDrawer={toggleDrawer}
          subjectForm={subjectForm}
          onSubmitSubject={submitCreateSubject}
          isSubmitting={isPending}
        />
      ) : null}

      {activeView === "assignments" ? (
        <TeacherAssignmentsPanel
          assignments={filteredAssignments}
          sections={filteredSections}
          subjects={overview.subjects}
          members={members}
          canManageAcademic={canManageAcademic}
          openDrawer={openDrawer}
          onToggleDrawer={toggleDrawer}
          assignmentForm={assignmentForm}
          onSubmitAssignment={submitAssignTeacher}
          isSubmitting={isPending}
        />
      ) : null}
    </div>
  );
}
