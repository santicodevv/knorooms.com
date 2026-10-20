"use client";

import type {
  AcademicYearDto,
  AttendanceDailyMetricsDto,
  EvaluationPolicyVersionDto,
  GradingMetricsDto,
  SchoolSectionDto,
  SubjectDto,
} from "@/lib/api/types";
import { EVALUATION_PERIOD_OPTIONS } from "../schemas/evaluations-schemas";

export interface EvaluationsContextStripProps {
  academicYears: AcademicYearDto[];
  availableSections: SchoolSectionDto[];
  subjects: SubjectDto[];
  selectedAcademicYearId: string;
  selectedSectionId: string;
  selectedSubjectId: string;
  selectedPeriodCode: string;
  selectedDate: string;
  activePolicy: EvaluationPolicyVersionDto | null;
  attendanceMetrics: AttendanceDailyMetricsDto;
  gradingMetrics: GradingMetricsDto;
  publishedSnapshotsCount: number;
  isLoadingFilters: boolean;
  onAcademicYearChange: (yearId: string) => void;
  onSectionChange: (sectionId: string) => void;
  onSubjectChange: (subjectId: string) => void;
  onPeriodChange: (periodCode: string) => void;
  onDateChange: (date: string) => void;
}

export function EvaluationsContextStrip({
  academicYears,
  availableSections,
  subjects,
  selectedAcademicYearId,
  selectedSectionId,
  selectedSubjectId,
  selectedPeriodCode,
  selectedDate,
  activePolicy,
  attendanceMetrics,
  gradingMetrics,
  publishedSnapshotsCount,
  isLoadingFilters,
  onAcademicYearChange,
  onSectionChange,
  onSubjectChange,
  onPeriodChange,
  onDateChange,
}: EvaluationsContextStripProps) {
  return (
    <section className="animate-fade-in-up space-y-4">
      {/* Barra de filtros contextuales */}
      <div className="surface-card flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200/80 bg-white/95 p-3.5 shadow-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-col gap-1">
            <label
              htmlFor="eval-year-select"
              className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase"
            >
              Año Escolar
            </label>
            <select
              id="eval-year-select"
              value={selectedAcademicYearId}
              disabled={isLoadingFilters || academicYears.length === 0}
              onChange={(e) => onAcademicYearChange(e.target.value)}
              className="h-9 rounded-lg border border-slate-200 bg-slate-50/70 px-3 text-xs font-medium text-slate-800 transition-colors focus:border-indigo-500 focus:bg-white focus:outline-none"
            >
              {academicYears.length === 0 ? (
                <option value="">Sin años escolares</option>
              ) : (
                academicYears.map((y) => (
                  <option key={y.id} value={y.id}>
                    {y.name} ({y.code}){y.isClosed ? " — Cerrado" : ""}
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label
              htmlFor="eval-section-select"
              className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase"
            >
              Sección / Aula
            </label>
            <select
              id="eval-section-select"
              value={selectedSectionId}
              disabled={isLoadingFilters || availableSections.length === 0}
              onChange={(e) => onSectionChange(e.target.value)}
              className="h-9 rounded-lg border border-slate-200 bg-slate-50/70 px-3 text-xs font-medium text-slate-800 transition-colors focus:border-indigo-500 focus:bg-white focus:outline-none"
            >
              {availableSections.length === 0 ? (
                <option value="">Sin secciones en este año</option>
              ) : (
                availableSections.map((sec) => (
                  <option key={sec.id} value={sec.id}>
                    {sec.gradeLevelName} — Sección {sec.code} ({sec.shift})
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label
              htmlFor="eval-subject-select"
              className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase"
            >
              Asignatura
            </label>
            <select
              id="eval-subject-select"
              value={selectedSubjectId}
              disabled={isLoadingFilters || subjects.length === 0}
              onChange={(e) => onSubjectChange(e.target.value)}
              className="h-9 rounded-lg border border-slate-200 bg-slate-50/70 px-3 text-xs font-medium text-slate-800 transition-colors focus:border-indigo-500 focus:bg-white focus:outline-none"
            >
              {subjects.length === 0 ? (
                <option value="">Sin asignaturas registradas</option>
              ) : (
                subjects.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.code} · {sub.name}
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label
              htmlFor="eval-period-select"
              className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase"
            >
              Período MINERD
            </label>
            <select
              id="eval-period-select"
              value={selectedPeriodCode}
              disabled={isLoadingFilters}
              onChange={(e) => onPeriodChange(e.target.value)}
              className="h-9 rounded-lg border border-slate-200 bg-slate-50/70 px-3 text-xs font-semibold text-indigo-950 transition-colors focus:border-indigo-500 focus:bg-white focus:outline-none"
            >
              {EVALUATION_PERIOD_OPTIONS.map((p) => (
                <option key={p.code} value={p.code}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label
              htmlFor="eval-date-input"
              className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase"
            >
              Fecha Asistencia
            </label>
            <input
              id="eval-date-input"
              type="date"
              value={selectedDate}
              disabled={isLoadingFilters}
              onChange={(e) => onDateChange(e.target.value)}
              className="h-9 rounded-lg border border-slate-200 bg-slate-50/70 px-3 text-xs font-medium text-slate-800 tabular-nums transition-colors focus:border-indigo-500 focus:bg-white focus:outline-none"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {activePolicy ? (
            <div className="inline-flex items-center gap-2 rounded-lg border border-indigo-200/80 bg-indigo-50/70 px-3 py-1.5 text-xs">
              <span className="h-2 w-2 rounded-full bg-indigo-600" />
              <span className="font-semibold text-indigo-950">
                {activePolicy.policyCode} v{activePolicy.versionNumber}
              </span>
              <span className="text-indigo-700/80 tabular-nums">
                (Mín. {activePolicy.minPassingScore} pts)
              </span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-900">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              Sin política de evaluación activa
            </div>
          )}
        </div>
      </div>

      {/* Cinta de 4 KPIs operativos */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="surface-card rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              Asistencia del Día ({selectedDate})
            </span>
            <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 tabular-nums">
              {attendanceMetrics.recordedCount}/{attendanceMetrics.totalEnrolled} registrados
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-slate-900 tabular-nums">
              {attendanceMetrics.dailyAttendancePercentage.toFixed(1)}%
            </span>
            <span className="text-xs text-slate-500 tabular-nums">
              {attendanceMetrics.presentCount} P · {attendanceMetrics.lateCount} T ·{" "}
              {attendanceMetrics.absentCount} A
            </span>
          </div>
        </div>

        <div className="surface-card rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              Promedio en {selectedPeriodCode}
            </span>
            <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-700 tabular-nums">
              Mín. {gradingMetrics.minPassingScore} pts
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-slate-900 tabular-nums">
              {gradingMetrics.averageScore.toFixed(1)}
            </span>
            <span className="text-xs text-slate-500 tabular-nums">
              {gradingMetrics.passingStudentsCount}/{gradingMetrics.gradedStudentsCount} sobre el
              mínimo
            </span>
          </div>
        </div>

        <div className="surface-card rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              Cobertura del Acta ({selectedPeriodCode})
            </span>
            <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700 tabular-nums">
              {gradingMetrics.approvedEntriesCount} aprobadas
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-slate-900 tabular-nums">
              {gradingMetrics.gradedStudentsCount}
              <span className="text-base font-normal text-slate-400">
                /{gradingMetrics.totalStudentsInSection}
              </span>
            </span>
            <span className="text-xs text-slate-500">estudiantes calificados</span>
          </div>
        </div>

        <div className="surface-card rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              Boletines Inmutables ({selectedPeriodCode})
            </span>
            <span className="rounded-md bg-violet-50 px-2 py-0.5 text-[11px] font-semibold text-violet-700">
              Snapshots JSONB
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-slate-900 tabular-nums">
              {publishedSnapshotsCount}
            </span>
            <span className="text-xs text-slate-500">versiones auditadas emitidas</span>
          </div>
        </div>
      </div>
    </section>
  );
}
