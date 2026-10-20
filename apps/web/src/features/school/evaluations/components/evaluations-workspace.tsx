"use client";

import { BookOpenCheck, CalendarCheck2, FileSpreadsheet, X } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type {
  AcademicStructureOverviewDto,
  GradingWorkspaceOverviewDto,
  ProblemDetails,
  ReportCardsOverviewDto,
  SectionAttendanceOverviewDto,
} from "@/lib/api/types";
import { useEvaluationsWorkspace, type EvaluationsTab } from "../hooks/use-evaluations-workspace";
import { AttendanceRollCallPanel } from "./attendance-roll-call-panel";
import { EvaluationsContextStrip } from "./evaluations-context-strip";
import { GradebookSpreadsheetPanel } from "./gradebook-spreadsheet-panel";
import { ReportCardsSnapshotsPanel } from "./report-cards-snapshots-panel";

export interface EvaluationsWorkspaceProps {
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

const WORKSPACE_TABS: Array<{
  id: EvaluationsTab;
  label: string;
  badgeText: string;
  Icon: typeof CalendarCheck2;
}> = [
  {
    id: "attendance",
    label: "Pase de Lista Diario",
    badgeText: "Asistencia",
    Icon: CalendarCheck2,
  },
  {
    id: "gradebook",
    label: "Libro de Calificaciones y Políticas",
    badgeText: "MINERD",
    Icon: FileSpreadsheet,
  },
  {
    id: "report-cards",
    label: "Boletines Oficiales Inmutables",
    badgeText: "Snapshots",
    Icon: BookOpenCheck,
  },
];

export function EvaluationsWorkspace({
  initialAcademicOverview,
  initialAttendance,
  initialGrading,
  initialReportCards,
  initialProblem,
  csrfToken,
  canRecordAttendance,
  canRecordGrades,
  canApproveGrades,
  canPublishReportCards,
}: EvaluationsWorkspaceProps) {
  const ws = useEvaluationsWorkspace({
    initialAcademicOverview,
    initialAttendance,
    initialGrading,
    initialReportCards,
    csrfToken,
  });

  return (
    <div className="space-y-6">
      {initialProblem && (
        <Alert variant="destructive">
          <AlertTitle>{initialProblem.title ?? "Error al cargar evaluaciones"}</AlertTitle>
          <AlertDescription>
            {initialProblem.detail ??
              "No fue posible recuperar todos los datos de asistencia o calificaciones."}
          </AlertDescription>
        </Alert>
      )}

      {ws.feedback && (
        <div
          className={`animate-slide-down flex items-start justify-between gap-3 rounded-xl border px-4 py-3 text-xs ${
            ws.feedback.tone === "success"
              ? "border-emerald-200 bg-emerald-50/90 text-emerald-950"
              : "border-rose-200 bg-rose-50/90 text-rose-950"
          }`}
        >
          <div>
            <p className="font-semibold">{ws.feedback.title}</p>
            <p className="mt-0.5 opacity-90">{ws.feedback.detail}</p>
          </div>
          <button
            type="button"
            onClick={ws.dismissFeedback}
            className="rounded-md p-1 opacity-70 hover:bg-black/5 hover:opacity-100"
            aria-label="Cerrar notificación"
          >
            <X className="size-3.5" />
          </button>
        </div>
      )}

      {/* Filtros contextuales + Cinta de KPIs */}
      <EvaluationsContextStrip
        academicYears={ws.academicYears}
        availableSections={ws.availableSections}
        subjects={ws.subjects}
        selectedAcademicYearId={ws.selectedAcademicYearId}
        selectedSectionId={ws.selectedSectionId}
        selectedSubjectId={ws.selectedSubjectId}
        selectedPeriodCode={ws.selectedPeriodCode}
        selectedDate={ws.selectedDate}
        activePolicy={ws.gradingOverview.activePolicy}
        attendanceMetrics={ws.attendanceOverview.metrics}
        gradingMetrics={ws.gradingOverview.metrics}
        publishedSnapshotsCount={ws.reportCardsOverview.snapshots.length}
        isLoadingFilters={ws.isLoadingFilters}
        onAcademicYearChange={(id) => void ws.handleAcademicYearChange(id)}
        onSectionChange={(id) => void ws.handleSectionChange(id)}
        onSubjectChange={(id) => void ws.handleSubjectChange(id)}
        onPeriodChange={(code) => void ws.handlePeriodChange(code)}
        onDateChange={(date) => void ws.handleDateChange(date)}
      />

      {/* Selector de sub-módulos (Asistencia / Calificaciones / Boletines) */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="inline-flex flex-wrap items-center gap-1.5 rounded-xl border border-slate-200/80 bg-slate-100/80 p-1">
          {WORKSPACE_TABS.map(({ id, label, badgeText, Icon }) => {
            const isActive = ws.activeTab === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => ws.setActiveTab(id)}
                className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition-all ${
                  isActive
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Icon className="size-3.5 text-indigo-600" />
                <span>{label}</span>
                <span
                  className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                    isActive ? "bg-indigo-50 text-indigo-700" : "bg-slate-200/70 text-slate-600"
                  }`}
                >
                  {badgeText}
                </span>
              </button>
            );
          })}
        </div>

        {ws.isLoadingFilters && (
          <span className="text-xs font-medium text-indigo-600">
            Sincronizando registros de la sección...
          </span>
        )}
      </div>

      {/* Contenido activo */}
      {ws.activeTab === "attendance" && (
        <AttendanceRollCallPanel
          sectionLabel={ws.attendanceOverview.selectedSectionLabel}
          selectedDate={ws.selectedDate}
          roster={ws.effectiveAttendanceRoster}
          canRecordAttendance={canRecordAttendance}
          isSubmitting={ws.isSubmitting}
          onSetStudentAttendance={ws.handleSetStudentAttendance}
          onSetJustification={ws.handleSetAttendanceJustification}
          onMarkAllPresent={ws.handleMarkAllPresent}
          onSaveBatch={ws.handleSaveAttendanceBatch}
        />
      )}

      {ws.activeTab === "gradebook" && (
        <GradebookSpreadsheetPanel
          academicYears={ws.academicYears}
          selectedAcademicYearId={ws.selectedAcademicYearId}
          sectionLabel={ws.gradingOverview.selectedSectionLabel}
          subjectName={ws.gradingOverview.selectedSubjectName}
          selectedPeriodCode={ws.selectedPeriodCode}
          policies={ws.gradingOverview.policies}
          activePolicy={ws.gradingOverview.activePolicy}
          rows={ws.effectiveGradebookRows}
          canRecordGrades={canRecordGrades}
          canApproveGrades={canApproveGrades}
          isSubmitting={ws.isSubmitting}
          onSetScoreDraft={ws.handleSetGradeDraftScore}
          onSetCorrectionReason={ws.handleSetGradeCorrectionReason}
          onSaveGradesBatch={ws.handleSaveGradesBatch}
          onApproveEntry={ws.handleApproveGradeEntry}
          onCreatePolicy={ws.handleCreateEvaluationPolicy}
        />
      )}

      {ws.activeTab === "report-cards" && (
        <ReportCardsSnapshotsPanel
          sectionLabel={ws.reportCardsOverview.selectedSectionLabel}
          selectedPeriodCode={ws.selectedPeriodCode}
          activeEvaluationPolicyVersionId={ws.reportCardsOverview.activeEvaluationPolicyVersionId}
          activeEvaluationPolicyName={ws.reportCardsOverview.activeEvaluationPolicyName}
          studentReadiness={ws.reportCardsOverview.studentReadiness}
          snapshots={ws.reportCardsOverview.snapshots}
          selectedSnapshot={ws.selectedSnapshot}
          selectedSnapshotPayload={ws.selectedSnapshotPayload}
          canPublishReportCards={canPublishReportCards}
          isSubmitting={ws.isSubmitting}
          onSelectSnapshot={ws.setSelectedSnapshotId}
          onPublishReportCard={ws.handlePublishReportCard}
        />
      )}
    </div>
  );
}
