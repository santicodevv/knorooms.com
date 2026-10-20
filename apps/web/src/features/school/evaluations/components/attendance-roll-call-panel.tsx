"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { AttendanceStatus, SectionAttendanceRosterItemDto } from "@/lib/api/types";
import { ATTENDANCE_STATUS_OPTIONS } from "../schemas/evaluations-schemas";

export interface EffectiveAttendanceRosterItem extends SectionAttendanceRosterItemDto {
  effectiveStatus: AttendanceStatus | null;
  effectiveJustificationNote: string;
  isDirty: boolean;
}

export interface AttendanceRollCallPanelProps {
  sectionLabel: string | null;
  selectedDate: string;
  roster: EffectiveAttendanceRosterItem[];
  canRecordAttendance: boolean;
  isSubmitting: boolean;
  onSetStudentAttendance: (
    enrollmentId: string,
    status: AttendanceStatus,
    justificationNote?: string,
  ) => void;
  onSetJustification: (enrollmentId: string, justificationNote: string) => void;
  onMarkAllPresent: () => void;
  onSaveBatch: () => Promise<boolean>;
}

const STATUS_ACTIVE_STYLES: Record<AttendanceStatus, string> = {
  Present: "border-emerald-600 bg-emerald-600 text-white shadow-xs hover:bg-emerald-700",
  Late: "border-amber-500 bg-amber-500 text-white shadow-xs hover:bg-amber-600",
  Excused: "border-sky-600 bg-sky-600 text-white shadow-xs hover:bg-sky-700",
  Absent: "border-rose-600 bg-rose-600 text-white shadow-xs hover:bg-rose-700",
};

export function AttendanceRollCallPanel({
  sectionLabel,
  selectedDate,
  roster,
  canRecordAttendance,
  isSubmitting,
  onSetStudentAttendance,
  onSetJustification,
  onMarkAllPresent,
  onSaveBatch,
}: AttendanceRollCallPanelProps) {
  const dirtyCount = roster.filter((r) => r.isDirty).length;

  return (
    <div className="animate-fade-in-up surface-card overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-xs">
      {/* Cabecera del pase de lista */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/60 px-5 py-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-slate-900">
              Pase de Lista Diario — {sectionLabel ?? "Sin sección activa"}
            </h2>
            <Badge variant="outline" className="font-mono text-[11px]">
              {selectedDate}
            </Badge>
            {dirtyCount > 0 && (
              <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-semibold text-amber-900 tabular-nums">
                {dirtyCount} cambio(s) sin guardar
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-slate-500">
            Marca presencia (P), tardanza (T), excusa justificada (E) o ausencia (A) y guarda el
            lote atómico en PostgreSQL.
          </p>
        </div>

        {canRecordAttendance && roster.length > 0 && (
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isSubmitting}
              onClick={onMarkAllPresent}
              className="text-xs"
            >
              Marcar todos presentes (P)
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={isSubmitting}
              onClick={() => void onSaveBatch()}
              className="bg-indigo-600 text-xs font-semibold text-white hover:bg-indigo-700"
            >
              {isSubmitting ? "Guardando asistencia..." : "Guardar pase de lista"}
            </Button>
          </div>
        )}
      </div>

      {roster.length === 0 ? (
        <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
          <p className="text-sm font-semibold text-slate-800">
            No hay estudiantes matriculados activamente en esta sección
          </p>
          <p className="mt-1 max-w-md text-xs text-slate-500">
            Ve al módulo de Estudiantes y Matrículas para inscribir alumnos en la sección antes de
            pasar lista.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/40 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
                <th className="px-5 py-3">Estudiante</th>
                <th className="px-4 py-3">Estado en Fecha ({selectedDate})</th>
                <th className="px-4 py-3">Observación / Justificación</th>
                <th className="px-4 py-3 text-right">Asistencia Acumulada</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {roster.map((student) => (
                <tr
                  key={student.enrollmentId}
                  className={`transition-colors hover:bg-slate-50/70 ${
                    student.isDirty ? "bg-indigo-50/20" : ""
                  }`}
                >
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-700">
                        {student.studentFullName.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">{student.studentFullName}</p>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500">
                          <span className="font-mono">{student.studentCode}</span>
                          {student.nationalStudentId && (
                            <span>· RNE {student.nationalStudentId}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-3.5">
                    <div className="inline-flex items-center gap-1 rounded-lg border border-slate-200/80 bg-slate-50 p-1">
                      {ATTENDANCE_STATUS_OPTIONS.map((opt) => {
                        const isSelected = student.effectiveStatus === opt.value;
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            disabled={!canRecordAttendance || isSubmitting}
                            onClick={() => onSetStudentAttendance(student.enrollmentId, opt.value)}
                            className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-all ${
                              isSelected
                                ? STATUS_ACTIVE_STYLES[opt.value]
                                : "text-slate-600 hover:bg-white hover:text-slate-900"
                            }`}
                            title={opt.label}
                          >
                            {opt.shortLabel} · {opt.label}
                          </button>
                        );
                      })}
                    </div>
                  </td>

                  <td className="px-4 py-3.5">
                    <Input
                      type="text"
                      placeholder="Nota opcional (ej. certificado médico, tardanza transporte)..."
                      value={student.effectiveJustificationNote}
                      disabled={!canRecordAttendance || isSubmitting}
                      onChange={(e) => onSetJustification(student.enrollmentId, e.target.value)}
                      className="h-8 max-w-xs text-xs"
                    />
                  </td>

                  <td className="px-4 py-3.5 text-right">
                    <div className="inline-flex flex-col items-end">
                      <span className="font-semibold text-slate-900 tabular-nums">
                        {student.cumulativeSummary.cumulativeAttendancePercentage.toFixed(1)}%
                      </span>
                      <span className="text-[11px] text-slate-500 tabular-nums">
                        {student.cumulativeSummary.presentDays}P ·{" "}
                        {student.cumulativeSummary.lateDays}T ·{" "}
                        {student.cumulativeSummary.excusedDays}E ·{" "}
                        {student.cumulativeSummary.absentDays}A (
                        {student.cumulativeSummary.totalDaysRecorded}d)
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
