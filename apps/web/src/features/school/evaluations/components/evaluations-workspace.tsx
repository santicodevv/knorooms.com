"use client";
import { ButtonLink } from "@/components/ui/button";
import { ProblemAlert } from "@/components/api/problem-alert";
import { EmptyState } from "@/components/shared/empty-state";
import { SchoolPageHeading, SchoolMetrics } from "../../components/school-ui";
import { useSchoolFeedback } from "../../hooks/use-school-feedback";
import { useUnsavedChanges } from "@/features/platform/hooks/use-unsaved-changes";
import { useEvaluationsWorkspace } from "../hooks/use-evaluations-workspace";
import { EvaluationFilters } from "./evaluation-filters";
import { AttendanceRollCallPanel } from "./attendance-roll-call-panel";
import { Gradebook } from "./gradebook";
import { EvaluationPolicies } from "./evaluation-policies";
import { ReportCards } from "./report-cards";
import type {
  AcademicStructureOverviewDto,
  GradingWorkspaceOverviewDto,
  ProblemDetails,
  ReportCardsOverviewDto,
  SectionAttendanceOverviewDto,
} from "@/lib/api/types";
interface Props {
  path?: string[];
  initialAcademicOverview: AcademicStructureOverviewDto;
  initialAttendance: SectionAttendanceOverviewDto;
  initialGrading: GradingWorkspaceOverviewDto;
  initialReportCards: ReportCardsOverviewDto;
  initialProblem: ProblemDetails | null;
  csrfToken: string;
  canRecordAttendance: boolean;
  canRecordGrades: boolean;
  canApproveGrades: boolean;
  canPublishReportCards: boolean;
}
export function EvaluationsWorkspace({
  path = ["attendance"],
  initialProblem,
  canRecordAttendance,
  canRecordGrades,
  canApproveGrades,
  canPublishReportCards,
  ...data
}: Props) {
  const area = path[0],
    creating = path[2] === "new",
    s = useEvaluationsWorkspace({
      ...data,
      view:
        area === "settings"
          ? "policies"
          : area === "grading"
            ? "gradebook"
            : area === "report-cards"
              ? "report-cards"
              : "attendance",
    });
  useSchoolFeedback(s.feedback);
  useUnsavedChanges(
    s.effectiveAttendanceRoster.some((r) => r.isDirty) ||
      s.effectiveGradebookRows.some((r) => r.isDirty),
  );
  const title =
    area === "attendance"
      ? "Pase de lista"
      : area === "grading"
        ? "Calificaciones"
        : area === "settings"
          ? creating
            ? "Nueva política de evaluación"
            : "Políticas de evaluación"
          : "Boletas";
  const metrics =
    area === "attendance"
      ? [
          {
            label: "Estudiantes de la sección",
            value: s.attendanceOverview.metrics.totalEnrolled,
          },
          { label: "Registros guardados", value: s.attendanceOverview.metrics.recordedCount },
          { label: "Presentes", value: s.attendanceOverview.metrics.presentCount },
          {
            label: "Ausencias / tardanzas",
            value:
              s.attendanceOverview.metrics.absentCount +
              " / " +
              s.attendanceOverview.metrics.lateCount,
          },
        ]
      : area === "grading"
        ? [
            { label: "Estudiantes", value: s.gradingOverview.metrics.totalStudentsInSection },
            { label: "Notas capturadas", value: s.gradingOverview.metrics.gradedStudentsCount },
            {
              label: "Promedio del período",
              value: s.gradingOverview.metrics.averageScore.toFixed(1),
            },
            {
              label: "Nota mínima",
              value: s.gradingOverview.activePolicy?.minPassingScore ?? "Sin política",
            },
          ]
        : [];
  return (
    <div>
      {initialProblem && <ProblemAlert problem={initialProblem} />}
      <SchoolPageHeading
        onRefresh={creating ? undefined : () => void s.handleRefresh()}
        refreshing={s.isLoadingFilters}
        title={title}
        description={
          area === "attendance"
            ? "Registra presencia, ausencia, tardanza o excusa. Sin marcar no significa ausente."
            : area === "grading"
              ? "Registra notas por materia y período. La aprobación corresponde a otro usuario autorizado."
              : area === "settings"
                ? "Configura las reglas académicas por año y versión."
                : "Publica versiones y consulta el historial académico de cada estudiante."
        }
        back={creating ? "/settings/policies" : undefined}
        actions={
          area === "grading" ? (
            <ButtonLink variant="outline" href="/settings/policies">
              Políticas de evaluación
            </ButtonLink>
          ) : area === "settings" && !creating && canApproveGrades ? (
            <ButtonLink href="/settings/policies/new">Nueva política</ButtonLink>
          ) : undefined
        }
      />
      {s.feedback?.tone === "error" && (
        <p
          role="alert"
          className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-800"
        >
          {s.feedback.title} · {s.feedback.detail}
        </p>
      )}
      {!creating && <EvaluationFilters state={s} area={area} />}{" "}
      {metrics.length > 0 && <SchoolMetrics items={metrics} />}{" "}
      {area === "attendance" ? (
        <AttendanceRollCallPanel
          sectionLabel={s.attendanceOverview.selectedSectionLabel}
          selectedDate={s.selectedDate}
          roster={s.effectiveAttendanceRoster}
          canRecordAttendance={canRecordAttendance}
          isSubmitting={s.isSubmitting || s.isLoadingFilters}
          onSetStudentAttendance={s.handleSetStudentAttendance}
          onSetJustification={s.handleSetAttendanceJustification}
          onMarkAllPresent={s.handleMarkAllPresent}
          onSaveBatch={s.handleSaveAttendanceBatch}
        />
      ) : area === "grading" ? (
        <Gradebook state={s} canRecord={canRecordGrades} canApprove={canApproveGrades} />
      ) : area === "settings" ? (
        creating && !canApproveGrades ? (
          <EmptyState title="No tienes permiso para crear políticas" />
        ) : (
          <EvaluationPolicies state={s} creating={creating} />
        )
      ) : (
        <ReportCards state={s} canPublish={canPublishReportCards} />
      )}
    </div>
  );
}
