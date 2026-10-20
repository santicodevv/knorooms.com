"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ReportCardSnapshotDto, StudentReportCardReadinessDto } from "@/lib/api/types";
import type {
  ParsedReportCardPayload,
  PublishReportCardFormValues,
} from "../schemas/evaluations-schemas";

export interface ReportCardsSnapshotsPanelProps {
  sectionLabel: string | null;
  selectedPeriodCode: string;
  activeEvaluationPolicyVersionId: string | null;
  activeEvaluationPolicyName: string | null;
  studentReadiness: StudentReportCardReadinessDto[];
  snapshots: ReportCardSnapshotDto[];
  selectedSnapshot: ReportCardSnapshotDto | null;
  selectedSnapshotPayload: ParsedReportCardPayload | null;
  canPublishReportCards: boolean;
  isSubmitting: boolean;
  onSelectSnapshot: (snapshotId: string) => void;
  onPublishReportCard: (values: PublishReportCardFormValues) => Promise<boolean>;
}

export function ReportCardsSnapshotsPanel({
  sectionLabel,
  selectedPeriodCode,
  activeEvaluationPolicyVersionId,
  activeEvaluationPolicyName,
  studentReadiness,
  snapshots,
  selectedSnapshot,
  selectedSnapshotPayload,
  canPublishReportCards,
  isSubmitting,
  onSelectSnapshot,
  onPublishReportCard,
}: ReportCardsSnapshotsPanelProps) {
  const [rectificationEnrollmentId, setRectificationEnrollmentId] = useState<string | null>(null);
  const [correctionReasonInput, setCorrectionReasonInput] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  const handleEmitInitial = async (enrollmentId: string) => {
    if (!activeEvaluationPolicyVersionId) {
      return;
    }
    setLocalError(null);
    await onPublishReportCard({
      enrollmentId,
      evaluationPolicyVersionId: activeEvaluationPolicyVersionId,
      periodCode: selectedPeriodCode,
      isRectification: false,
      correctionReason: "",
    });
  };

  const handleConfirmRectification = async (enrollmentId: string) => {
    if (!activeEvaluationPolicyVersionId) {
      return;
    }
    if (correctionReasonInput.trim().length < 10) {
      setLocalError("El motivo de rectificación auditable debe tener al menos 10 caracteres.");
      return;
    }
    setLocalError(null);
    const ok = await onPublishReportCard({
      enrollmentId,
      evaluationPolicyVersionId: activeEvaluationPolicyVersionId,
      periodCode: selectedPeriodCode,
      isRectification: true,
      correctionReason: correctionReasonInput.trim(),
    });
    if (ok) {
      setRectificationEnrollmentId(null);
      setCorrectionReasonInput("");
    }
  };

  return (
    <div className="animate-fade-in-up grid grid-cols-1 gap-5 lg:grid-cols-12">
      {/* Columna izquierda: Estado de preparación y emisión por estudiante */}
      <div className="surface-card overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-xs lg:col-span-5">
        <div className="border-b border-slate-100 bg-slate-50/60 px-5 py-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-slate-900">
              Emisión de Boletines ({selectedPeriodCode})
            </h2>
            <Badge variant="outline" className="text-[11px]">
              {sectionLabel ?? "Sin sección"}
            </Badge>
          </div>
          <p className="mt-0.5 text-xs text-slate-500">
            {activeEvaluationPolicyName
              ? `Política activa: ${activeEvaluationPolicyName}`
              : "Configura una política de evaluación en la pestaña de Calificaciones antes de emitir."}
          </p>
        </div>

        {studentReadiness.length === 0 ? (
          <div className="px-5 py-12 text-center text-xs text-slate-500">
            No hay estudiantes matriculados en esta sección.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {studentReadiness.map((student) => {
              const isRectifyingThis = rectificationEnrollmentId === student.enrollmentId;
              const isSelectedStudent = selectedSnapshot?.enrollmentId === student.enrollmentId;

              return (
                <div
                  key={student.enrollmentId}
                  className={`p-4 transition-colors ${
                    isSelectedStudent ? "bg-indigo-50/40" : "hover:bg-slate-50/60"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold text-slate-900">
                        {student.studentFullName}
                      </p>
                      <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-slate-500 tabular-nums">
                        <span className="font-mono">{student.studentCode}</span>
                        <span>·</span>
                        <span>
                          {student.recordedSubjectsCount}/{student.totalGradeSubjectsCount}{" "}
                          asignaturas
                        </span>
                        {student.periodAverageScore !== null && (
                          <>
                            <span>·</span>
                            <span className="font-semibold text-slate-800">
                              Prom: {student.periodAverageScore.toFixed(1)}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {student.latestPublishedVersion > 0 && student.latestSnapshotId && (
                        <button
                          type="button"
                          onClick={() => onSelectSnapshot(student.latestSnapshotId!)}
                          className="rounded-md border border-violet-200 bg-violet-50 px-2 py-1 text-[11px] font-semibold text-violet-700 hover:bg-violet-100"
                        >
                          Ver v{student.latestPublishedVersion}
                        </button>
                      )}

                      {canPublishReportCards &&
                        activeEvaluationPolicyVersionId &&
                        student.recordedSubjectsCount > 0 && (
                          <>
                            {student.latestPublishedVersion === 0 ? (
                              <Button
                                type="button"
                                size="sm"
                                disabled={isSubmitting}
                                onClick={() => void handleEmitInitial(student.enrollmentId)}
                                className="h-7 bg-indigo-600 px-2.5 text-[11px] font-semibold text-white hover:bg-indigo-700"
                              >
                                Publicar v1
                              </Button>
                            ) : (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={isSubmitting}
                                onClick={() => {
                                  setRectificationEnrollmentId(
                                    isRectifyingThis ? null : student.enrollmentId,
                                  );
                                  setCorrectionReasonInput("");
                                  setLocalError(null);
                                }}
                                className="h-7 px-2.5 text-[11px] font-semibold"
                              >
                                Rectificar v{student.latestPublishedVersion + 1}
                              </Button>
                            )}
                          </>
                        )}
                    </div>
                  </div>

                  {isRectifyingThis && (
                    <div className="animate-slide-down mt-3 space-y-2 rounded-lg border border-amber-200 bg-amber-50/70 p-3">
                      <p className="text-[11px] font-semibold text-amber-950">
                        Rectificación Oficial Inmutable (crea versión v
                        {student.latestPublishedVersion + 1} conservando v
                        {student.latestPublishedVersion})
                      </p>
                      <Input
                        type="text"
                        placeholder="Motivo oficial de rectificación (mín. 10 caracteres, ej. Acta #104)..."
                        value={correctionReasonInput}
                        onChange={(e) => setCorrectionReasonInput(e.target.value)}
                        className="h-8 bg-white text-xs"
                      />
                      {localError && (
                        <p className="text-[11px] font-medium text-rose-600">{localError}</p>
                      )}
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setRectificationEnrollmentId(null)}
                          className="h-7 text-[11px]"
                        >
                          Cancelar
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          disabled={isSubmitting}
                          onClick={() => void handleConfirmRectification(student.enrollmentId)}
                          className="h-7 bg-amber-600 text-[11px] font-semibold text-white hover:bg-amber-700"
                        >
                          Emitir v{student.latestPublishedVersion + 1} Auditada
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Columna derecha: Visor del Boletín Oficial Inmutable (Snapshot JSONB) */}
      <div className="surface-card overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-xs lg:col-span-7">
        {!selectedSnapshot || !selectedSnapshotPayload ? (
          <div className="flex h-full min-h-80 flex-col items-center justify-center px-6 py-14 text-center">
            <p className="text-sm font-semibold text-slate-800">
              Ningún boletín publicado seleccionado
            </p>
            <p className="mt-1 max-w-md text-xs text-slate-500">
              Registra las calificaciones del estudiante y pulsa &ldquo;Publicar v1&rdquo; para
              generar su instantánea histórica inmutable.
            </p>
          </div>
        ) : (
          <div className="p-6">
            {/* Selector de versiones históricas del boletín */}
            <div className="mb-5 flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-4">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
                  Historial de Versiones:
                </span>
                {snapshots
                  .filter((s) => s.enrollmentId === selectedSnapshot.enrollmentId)
                  .map((snap) => (
                    <button
                      key={snap.id}
                      type="button"
                      onClick={() => onSelectSnapshot(snap.id)}
                      className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
                        snap.id === selectedSnapshot.id
                          ? "bg-indigo-600 text-white"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      }`}
                    >
                      v{snap.versionNumber} · {snap.periodCode}
                    </button>
                  ))}
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => window.print()}
                className="h-8 text-xs"
              >
                Imprimir / PDF Oficial
              </Button>
            </div>

            {/* Encabezado Institucional del Boletín */}
            <div className="rounded-xl border border-slate-200/90 bg-slate-50/50 p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-bold tracking-widest text-indigo-600 uppercase">
                    República Dominicana · Boletín Oficial de Calificaciones
                  </p>
                  <h3 className="mt-1 text-lg font-bold text-slate-900">
                    {selectedSnapshotPayload.institutionName}
                  </h3>
                  <p className="text-xs text-slate-600">
                    {selectedSnapshotPayload.academicYearName} · {selectedSnapshotPayload.gradeName}{" "}
                    (Sección {selectedSnapshotPayload.sectionName})
                  </p>
                </div>

                <div className="text-right">
                  <span className="inline-flex items-center rounded-lg bg-violet-100 px-3 py-1 text-xs font-bold text-violet-900">
                    Instantánea Inmutable v{selectedSnapshot.versionNumber} (
                    {selectedSnapshot.periodCode})
                  </span>
                  <p className="mt-1 font-mono text-[11px] text-slate-500">
                    ID: {selectedSnapshot.id.slice(0, 13)}...
                  </p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 border-t border-slate-200/80 pt-4 text-xs sm:grid-cols-3">
                <div>
                  <span className="text-[11px] text-slate-400">Estudiante</span>
                  <p className="font-semibold text-slate-900">
                    {selectedSnapshotPayload.studentFullName}
                  </p>
                  <p className="font-mono text-[11px] text-slate-500">
                    {selectedSnapshotPayload.studentCode}
                    {selectedSnapshotPayload.nationalStudentId
                      ? ` · RNE ${selectedSnapshotPayload.nationalStudentId}`
                      : ""}
                  </p>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400">Política Aplicada</span>
                  <p className="font-semibold text-slate-900">
                    {selectedSnapshotPayload.policyCode} v{selectedSnapshotPayload.policyVersion}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Mínimo aprobatorio: {selectedSnapshotPayload.minPassingScore} pts
                  </p>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400">Promedio y Condición</span>
                  <p className="text-base font-bold text-indigo-950 tabular-nums">
                    {selectedSnapshotPayload.averageScore.toFixed(2)} pts
                  </p>
                  <p className="text-[11px] font-semibold text-emerald-700">
                    {selectedSnapshotPayload.academicStanding}
                  </p>
                </div>
              </div>
            </div>

            {/* Desglose de Asignaturas en la Instantánea */}
            <div className="mt-5 overflow-hidden rounded-xl border border-slate-200/80">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200/80 bg-slate-50 text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
                    <th className="px-4 py-2.5">Código</th>
                    <th className="px-4 py-2.5">Asignatura Curricular</th>
                    <th className="px-4 py-2.5 text-right">
                      Calificación ({selectedSnapshot.periodCode})
                    </th>
                    <th className="px-4 py-2.5 text-right">Resultado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {selectedSnapshotPayload.subjects.map((sub) => (
                    <tr key={sub.subjectCode}>
                      <td className="px-4 py-3 font-mono text-slate-600">{sub.subjectCode}</td>
                      <td className="px-4 py-3 font-semibold text-slate-900">{sub.subjectName}</td>
                      <td className="px-4 py-3 text-right font-mono text-sm font-bold text-slate-900 tabular-nums">
                        {sub.numericScore.toFixed(1)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {sub.isPassing ? (
                          <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                            Aprobada
                          </span>
                        ) : (
                          <span className="rounded-md bg-rose-50 px-2 py-0.5 text-[11px] font-semibold text-rose-700">
                            En Recuperación
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Resumen de Asistencia y Trazabilidad de Rectificación */}
            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-200/80 bg-slate-50/40 p-4 text-xs">
                <p className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
                  Asistencia Escolar en Corte
                </p>
                <p className="mt-1 text-base font-bold text-slate-900 tabular-nums">
                  {selectedSnapshotPayload.attendance.attendancePercentage.toFixed(1)}% de presencia
                  efectiva
                </p>
                <p className="mt-0.5 text-[11px] text-slate-600 tabular-nums">
                  {selectedSnapshotPayload.attendance.presentDays} Presentes ·{" "}
                  {selectedSnapshotPayload.attendance.lateDays} Tardanzas ·{" "}
                  {selectedSnapshotPayload.attendance.excusedDays} Excusas ·{" "}
                  {selectedSnapshotPayload.attendance.absentDays} Ausencias
                </p>
              </div>

              <div className="rounded-xl border border-slate-200/80 bg-slate-50/40 p-4 text-xs">
                <p className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
                  Sello de Auditoría e Inmutabilidad
                </p>
                <p className="mt-1 font-medium text-slate-800">
                  Emitido por: {selectedSnapshot.publishedByDisplayName}
                </p>
                <p className="text-[11px] text-slate-500">
                  Fecha UTC: {new Date(selectedSnapshot.publishedAtUtc).toLocaleString("es-DO")}
                </p>
                {selectedSnapshot.correctionReason && (
                  <p className="mt-1.5 rounded bg-amber-100/80 px-2 py-1 text-[11px] font-medium text-amber-950">
                    Motivo de rectificación: {selectedSnapshot.correctionReason}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
