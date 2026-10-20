"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type {
  AcademicYearDto,
  EvaluationPolicyVersionDto,
  StudentGradebookRowDto,
} from "@/lib/api/types";
import {
  createEvaluationPolicySchema,
  type CreateEvaluationPolicyFormValues,
} from "../schemas/evaluations-schemas";

export interface EffectiveGradebookRow extends StudentGradebookRowDto {
  draftScoreInput: string;
  effectiveScore: number | null;
  effectiveIsPassing: boolean | null;
  draftCorrectionReason: string;
  requiresCorrectionReason: boolean;
  isDirty: boolean;
}

export interface GradebookSpreadsheetPanelProps {
  academicYears: AcademicYearDto[];
  selectedAcademicYearId: string;
  sectionLabel: string | null;
  subjectName: string | null;
  selectedPeriodCode: string;
  policies: EvaluationPolicyVersionDto[];
  activePolicy: EvaluationPolicyVersionDto | null;
  rows: EffectiveGradebookRow[];
  canRecordGrades: boolean;
  canApproveGrades: boolean;
  isSubmitting: boolean;
  onSetScoreDraft: (enrollmentId: string, numericScore: string) => void;
  onSetCorrectionReason: (enrollmentId: string, correctionReason: string) => void;
  onSaveGradesBatch: () => Promise<boolean>;
  onApproveEntry: (gradeEntryId: string) => Promise<boolean>;
  onCreatePolicy: (values: CreateEvaluationPolicyFormValues) => Promise<boolean>;
}

export function GradebookSpreadsheetPanel({
  academicYears,
  selectedAcademicYearId,
  sectionLabel,
  subjectName,
  selectedPeriodCode,
  policies,
  activePolicy,
  rows,
  canRecordGrades,
  canApproveGrades,
  isSubmitting,
  onSetScoreDraft,
  onSetCorrectionReason,
  onSaveGradesBatch,
  onApproveEntry,
  onCreatePolicy,
}: GradebookSpreadsheetPanelProps) {
  const [showPolicyDrawer, setShowPolicyDrawer] = useState(false);

  const form = useForm<CreateEvaluationPolicyFormValues>({
    resolver: zodResolver(createEvaluationPolicySchema),
    defaultValues: {
      academicYearId: selectedAcademicYearId || academicYears[0]?.id || "",
      policyCode: "MINERD-ORD22-2017",
      versionNumber: (policies[0]?.versionNumber ?? 0) + 1,
      name: "Política de Evaluación Institucional MINERD",
      minPassingScore: 70,
      notes: "Escala numérica 0-100 con 4 períodos parciales (P1-P4)",
      isValidatedWithPilotSchool: true,
    },
  });

  const handlePolicySubmit = form.handleSubmit(async (values) => {
    const ok = await onCreatePolicy(values);
    if (ok) {
      setShowPolicyDrawer(false);
    }
  });

  return (
    <div className="animate-fade-in-up space-y-4">
      {/* Banner si no hay política configurada */}
      {!activePolicy && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50/90 px-5 py-4 text-xs text-amber-950">
          <div>
            <p className="font-semibold">
              Este año escolar aún no tiene una Política de Evaluación versionada
              (`EvaluationPolicyVersion`)
            </p>
            <p className="mt-0.5 text-amber-800">
              Para cumplir las reglas de KNOROOMS sin fijar fórmulas normativas en código duro,
              activa primero la política de evaluación del año escolar.
            </p>
          </div>
          {canApproveGrades && (
            <Button
              type="button"
              size="sm"
              onClick={() => {
                form.setValue("academicYearId", selectedAcademicYearId);
                setShowPolicyDrawer(true);
              }}
              className="bg-amber-600 text-xs font-semibold text-white hover:bg-amber-700"
            >
              Configurar Política MINERD
            </Button>
          )}
        </div>
      )}

      {/* Drawer de configuración de Política de Evaluación */}
      {showPolicyDrawer && (
        <form
          onSubmit={handlePolicySubmit}
          className="animate-slide-down surface-card space-y-4 rounded-xl border border-indigo-200 bg-indigo-50/30 p-5"
        >
          <div className="flex items-center justify-between border-b border-indigo-100 pb-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Nueva Versión de Política de Evaluación
              </h3>
              <p className="text-xs text-slate-500">
                Define el código normativo, la versión y el umbral mínimo aprobatorio (0-100) del
                año escolar.
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowPolicyDrawer(false)}
              className="text-xs"
            >
              Cancelar
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1.5">
              <Label htmlFor="pol-code" className="text-xs">
                Código Normativo
              </Label>
              <Input
                id="pol-code"
                placeholder="MINERD-SEC-ORD22"
                {...form.register("policyCode")}
                className="h-9 bg-white font-mono text-xs"
              />
              {form.formState.errors.policyCode && (
                <p className="text-[11px] text-rose-600">
                  {form.formState.errors.policyCode.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="pol-version" className="text-xs">
                Número de Versión
              </Label>
              <Input
                id="pol-version"
                type="number"
                {...form.register("versionNumber", { valueAsNumber: true })}
                className="h-9 bg-white text-xs tabular-nums"
              />
              {form.formState.errors.versionNumber && (
                <p className="text-[11px] text-rose-600">
                  {form.formState.errors.versionNumber.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="pol-name" className="text-xs">
                Nombre de la Política
              </Label>
              <Input
                id="pol-name"
                placeholder="Ordenanza 22-2017 / 04-2023"
                {...form.register("name")}
                className="h-9 bg-white text-xs"
              />
              {form.formState.errors.name && (
                <p className="text-[11px] text-rose-600">{form.formState.errors.name.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="pol-min" className="text-xs">
                Mínimo Aprobatorio (0-100)
              </Label>
              <Input
                id="pol-min"
                type="number"
                step="0.5"
                {...form.register("minPassingScore", { valueAsNumber: true })}
                className="h-9 bg-white text-xs tabular-nums"
              />
              {form.formState.errors.minPassingScore && (
                <p className="text-[11px] text-rose-600">
                  {form.formState.errors.minPassingScore.message}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <label className="inline-flex items-center gap-2 text-xs text-slate-700">
              <input
                type="checkbox"
                {...form.register("isValidatedWithPilotSchool")}
                className="h-4 w-4 rounded border-slate-300 text-indigo-600"
              />
              Política validada con dirección académica del colegio piloto
            </label>

            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting}
              className="bg-indigo-600 text-xs font-semibold text-white hover:bg-indigo-700"
            >
              {isSubmitting ? "Guardando versión..." : "Activar Política de Evaluación"}
            </Button>
          </div>
        </form>
      )}

      {/* Hoja de cálculo de calificaciones */}
      <div className="surface-card overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/60 px-5 py-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-sm font-semibold text-slate-900">
                Acta de Calificaciones — {subjectName ?? "Sin asignatura"} ·{" "}
                {sectionLabel ?? "Sin sección"}
              </h2>
              <Badge className="bg-indigo-600 text-[11px] text-white">{selectedPeriodCode}</Badge>
            </div>
            <p className="mt-0.5 text-xs text-slate-500">
              Registra puntuaciones en escala [0, 100]. Las modificaciones a notas
              aprobadas/publicadas exigen motivo de corrección auditable.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {canApproveGrades && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  form.setValue("academicYearId", selectedAcademicYearId);
                  form.setValue("versionNumber", (policies[0]?.versionNumber ?? 0) + 1);
                  setShowPolicyDrawer((v) => !v);
                }}
                className="text-xs"
              >
                {activePolicy ? "Nueva versión de política" : "Configurar política"}
              </Button>
            )}

            {canRecordGrades && rows.length > 0 && (
              <Button
                type="button"
                size="sm"
                disabled={isSubmitting || !activePolicy}
                onClick={() => void onSaveGradesBatch()}
                className="bg-indigo-600 text-xs font-semibold text-white hover:bg-indigo-700"
              >
                {isSubmitting
                  ? "Guardando acta..."
                  : `Guardar calificaciones (${selectedPeriodCode})`}
              </Button>
            )}
          </div>
        </div>

        {rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
            <p className="text-sm font-semibold text-slate-800">
              No hay estudiantes matriculados en la sección seleccionada
            </p>
            <p className="mt-1 max-w-md text-xs text-slate-500">
              Asegúrate de haber creado una asignatura y matriculado estudiantes activos en la
              sección.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/40 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
                  <th className="px-5 py-3">Estudiante</th>
                  <th className="px-4 py-3">Historial Períodos</th>
                  <th className="px-4 py-3">Nota ({selectedPeriodCode})</th>
                  <th className="px-4 py-3">Condición</th>
                  <th className="px-4 py-3">Estado Flujo / Autoría</th>
                  <th className="px-4 py-3">Motivo Corrección / Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((row) => (
                  <tr
                    key={row.enrollmentId}
                    className={`transition-colors hover:bg-slate-50/70 ${
                      row.isDirty ? "bg-indigo-50/20" : ""
                    }`}
                  >
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-slate-900">{row.studentFullName}</p>
                      <p className="font-mono text-[11px] text-slate-500">{row.studentCode}</p>
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {["P1", "P2", "P3", "P4"].map((pCode) => {
                          const score = row.periodScores[pCode];
                          return (
                            <span
                              key={pCode}
                              className={`rounded-md border px-2 py-0.5 text-[11px] font-medium tabular-nums ${
                                score !== undefined
                                  ? "border-slate-200 bg-slate-50 text-slate-800"
                                  : "border-dashed border-slate-200 text-slate-400"
                              }`}
                            >
                              {pCode}: {score !== undefined ? score : "—"}
                            </span>
                          );
                        })}
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        step="0.5"
                        placeholder="0 - 100"
                        value={row.draftScoreInput}
                        disabled={!canRecordGrades || isSubmitting || !activePolicy}
                        onChange={(e) => onSetScoreDraft(row.enrollmentId, e.target.value)}
                        className="h-8 w-24 font-mono text-xs font-semibold tabular-nums"
                      />
                    </td>

                    <td className="px-4 py-3.5">
                      {row.effectiveIsPassing === null ? (
                        <span className="text-slate-400">Pendiente</span>
                      ) : row.effectiveIsPassing ? (
                        <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                          Aprobado
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-md bg-rose-50 px-2 py-0.5 text-[11px] font-semibold text-rose-700">
                          Recuperación
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3.5">
                      {row.status ? (
                        <div>
                          <span
                            className={`inline-flex rounded-md px-2 py-0.5 text-[11px] font-semibold ${
                              row.status === "Published"
                                ? "bg-violet-50 text-violet-700"
                                : row.status === "Approved"
                                  ? "bg-emerald-50 text-emerald-700"
                                  : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {row.status === "Published"
                              ? "Publicada en Boletín"
                              : row.status === "Approved"
                                ? "Aprobada"
                                : "Borrador Docente"}
                          </span>
                          {row.recordedByDisplayName && (
                            <p className="mt-0.5 text-[11px] text-slate-400">
                              Reg: {row.recordedByDisplayName}
                              {row.approvedByDisplayName
                                ? ` · Apr: ${row.approvedByDisplayName}`
                                : ""}
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400">Sin registro</span>
                      )}
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        {(row.requiresCorrectionReason || row.correctionReason) && (
                          <Input
                            type="text"
                            placeholder="Motivo obligatorio de corrección..."
                            value={row.draftCorrectionReason}
                            disabled={!canRecordGrades || isSubmitting}
                            onChange={(e) =>
                              onSetCorrectionReason(row.enrollmentId, e.target.value)
                            }
                            className={`h-8 max-w-56 text-xs ${
                              row.requiresCorrectionReason ? "border-amber-400 bg-amber-50/40" : ""
                            }`}
                          />
                        )}

                        {canApproveGrades && row.gradeEntryId && row.status === "Draft" && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={isSubmitting}
                            onClick={() => void onApproveEntry(row.gradeEntryId!)}
                            title="Requiere un coordinador/director distinto al docente que registró la nota (Separación de funciones)"
                            className="h-7 px-2.5 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-50"
                          >
                            Aprobar
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
