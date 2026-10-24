"use client";

import { useCallback, useMemo, useState } from "react";
import type {
  AcademicStructureOverviewDto,
  AttendanceStatus,
  GradingWorkspaceOverviewDto,
  ReportCardSnapshotDto,
  ReportCardsOverviewDto,
  SectionAttendanceOverviewDto,
} from "@/lib/api/types";
import {
  approveGradeEntry,
  createEvaluationPolicy,
  getGradingWorkspaceOverview,
  getReportCardsOverview,
  getSectionAttendanceOverview,
  publishReportCard,
  recordSectionAttendanceBatch,
  recordSectionGradesBatch,
} from "../api/evaluations-api";
import {
  parseReportCardPayload,
  type CreateEvaluationPolicyFormValues,
  type PublishReportCardFormValues,
} from "../schemas/evaluations-schemas";

export type EvaluationsTab = "attendance" | "gradebook" | "report-cards";

export interface UseEvaluationsWorkspaceProps {
  initialAcademicOverview: AcademicStructureOverviewDto;
  initialAttendance: SectionAttendanceOverviewDto;
  initialGrading: GradingWorkspaceOverviewDto;
  initialReportCards: ReportCardsOverviewDto;
  csrfToken: string;
  view?: EvaluationsTab | "policies";
}

export interface FeedbackBanner {
  tone: "success" | "error";
  title: string;
  detail: string;
}

export interface AttendanceDraftEntry {
  status: AttendanceStatus;
  justificationNote: string;
}

export interface GradeDraftEntry {
  numericScore: string;
  correctionReason: string;
}

export function useEvaluationsWorkspace({
  initialAcademicOverview,
  initialAttendance,
  initialGrading,
  initialReportCards,
  csrfToken,
  view = "attendance",
}: UseEvaluationsWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<EvaluationsTab>("attendance");

  const [attendanceOverview, setAttendanceOverview] =
    useState<SectionAttendanceOverviewDto>(initialAttendance);
  const [gradingOverview, setGradingOverview] =
    useState<GradingWorkspaceOverviewDto>(initialGrading);
  const [reportCardsOverview, setReportCardsOverview] =
    useState<ReportCardsOverviewDto>(initialReportCards);

  const [selectedAcademicYearId, setSelectedAcademicYearId] = useState<string>(
    (view === "report-cards"
      ? initialReportCards.selectedAcademicYearId
      : view !== "attendance"
        ? initialGrading.selectedAcademicYearId
        : initialAttendance.selectedAcademicYearId) ??
      initialAcademicOverview.academicYears[0]?.id ??
      "",
  );
  const [selectedSectionId, setSelectedSectionId] = useState<string>(
    (view === "report-cards"
      ? initialReportCards.selectedSectionId
      : view !== "attendance"
        ? initialGrading.selectedSectionId
        : initialAttendance.selectedSectionId) ??
      initialAcademicOverview.sections[0]?.id ??
      "",
  );
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(
    initialGrading.selectedSubjectId ?? initialAcademicOverview.subjects[0]?.id ?? "",
  );
  const [selectedPeriodCode, setSelectedPeriodCode] = useState<string>(
    initialGrading.selectedPeriodCode || "P1",
  );
  const [selectedDate, setSelectedDate] = useState<string>(initialAttendance.selectedDate);

  const [attendanceDrafts, setAttendanceDrafts] = useState<Record<string, AttendanceDraftEntry>>(
    {},
  );
  const [gradeDrafts, setGradeDrafts] = useState<Record<string, GradeDraftEntry>>({});
  const hasDrafts = Object.keys(attendanceDrafts).length > 0 || Object.keys(gradeDrafts).length > 0;
  const confirmContextChange = useCallback(
    () =>
      !hasDrafts ||
      window.confirm("Hay cambios sin guardar. ¿Deseas descartarlos y cambiar la selección?"),
    [hasDrafts],
  );
  const [selectedSnapshotId, setSelectedSnapshotId] = useState<string | null>(
    initialReportCards.snapshots[0]?.id ?? null,
  );

  const [isLoadingFilters, setIsLoadingFilters] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackBanner | null>(null);

  const dismissFeedback = useCallback(() => {
    setFeedback(null);
  }, []);

  const availableSections = useMemo(() => {
    return initialAcademicOverview.sections.filter(
      (s) => !selectedAcademicYearId || s.academicYearId === selectedAcademicYearId,
    );
  }, [initialAcademicOverview.sections, selectedAcademicYearId]);

  const refreshWorkspace = useCallback(
    async (overrides?: {
      academicYearId?: string;
      sectionId?: string;
      subjectId?: string;
      periodCode?: string;
      attendanceDate?: string;
    }) => {
      const nextYearId = overrides?.academicYearId ?? selectedAcademicYearId;
      const nextSectionId = overrides?.sectionId ?? selectedSectionId;
      const nextSubjectId = overrides?.subjectId ?? selectedSubjectId;
      const nextPeriod = overrides?.periodCode ?? selectedPeriodCode;
      const nextDate = overrides?.attendanceDate ?? selectedDate;

      setIsLoadingFilters(true);
      try {
        const [attRes, gradRes, rcRes] = await Promise.all([
          view === "attendance"
            ? getSectionAttendanceOverview({
                academicYearId: nextYearId || undefined,
                sectionId: nextSectionId || undefined,
                attendanceDate: nextDate || undefined,
              })
            : Promise.resolve(null),
          view === "gradebook" || view === "policies"
            ? getGradingWorkspaceOverview({
                academicYearId: nextYearId || undefined,
                sectionId: nextSectionId || undefined,
                subjectId: nextSubjectId || undefined,
                periodCode: nextPeriod || undefined,
              })
            : Promise.resolve(null),
          view === "report-cards"
            ? getReportCardsOverview({
                academicYearId: nextYearId || undefined,
                sectionId: nextSectionId || undefined,
                periodCode: nextPeriod || undefined,
              })
            : Promise.resolve(null),
        ]);

        const failed = [attRes, gradRes, rcRes].find((result) => result && !result.ok);
        if (failed && !failed.ok)
          setFeedback({
            tone: "error",
            title: failed.problem.title,
            detail: failed.problem.detail ?? "No se pudieron actualizar los registros.",
          });
        if (attRes?.ok) {
          setAttendanceOverview(attRes.data);
          setAttendanceDrafts({});
        }
        if (gradRes?.ok) {
          setGradingOverview(gradRes.data);
          setGradeDrafts({});
        }
        if (rcRes?.ok) {
          setReportCardsOverview(rcRes.data);
        }
      } finally {
        setIsLoadingFilters(false);
      }
    },
    [
      view,
      selectedAcademicYearId,
      selectedSectionId,
      selectedSubjectId,
      selectedPeriodCode,
      selectedDate,
    ],
  );

  const handleAcademicYearChange = useCallback(
    async (academicYearId: string) => {
      if (!confirmContextChange()) return;
      setSelectedAcademicYearId(academicYearId);
      const firstSectionInYear =
        initialAcademicOverview.sections.find((s) => s.academicYearId === academicYearId)?.id ?? "";
      setSelectedSectionId(firstSectionInYear);
      await refreshWorkspace({
        academicYearId,
        sectionId: firstSectionInYear,
      });
    },
    [initialAcademicOverview.sections, refreshWorkspace, confirmContextChange],
  );

  const handleSectionChange = useCallback(
    async (sectionId: string) => {
      if (!confirmContextChange()) return;
      setSelectedSectionId(sectionId);
      await refreshWorkspace({ sectionId });
    },
    [refreshWorkspace, confirmContextChange],
  );

  const handleSubjectChange = useCallback(
    async (subjectId: string) => {
      if (!confirmContextChange()) return;
      setSelectedSubjectId(subjectId);
      await refreshWorkspace({ subjectId });
    },
    [refreshWorkspace, confirmContextChange],
  );

  const handlePeriodChange = useCallback(
    async (periodCode: string) => {
      if (!confirmContextChange()) return;
      setSelectedPeriodCode(periodCode);
      await refreshWorkspace({ periodCode });
    },
    [refreshWorkspace, confirmContextChange],
  );

  const handleDateChange = useCallback(
    async (attendanceDate: string) => {
      if (!confirmContextChange()) return;
      setSelectedDate(attendanceDate);
      await refreshWorkspace({ attendanceDate });
    },
    [refreshWorkspace, confirmContextChange],
  );

  // --- Attendance Logic ---
  const effectiveAttendanceRoster = useMemo(() => {
    return attendanceOverview.roster.map((item) => {
      const draft = attendanceDrafts[item.enrollmentId];
      return {
        ...item,
        effectiveStatus: draft?.status ?? item.status ?? null,
        effectiveJustificationNote:
          draft !== undefined ? draft.justificationNote : (item.justificationNote ?? ""),
        isDirty: draft !== undefined,
      };
    });
  }, [attendanceOverview.roster, attendanceDrafts]);

  const handleSetStudentAttendance = useCallback(
    (enrollmentId: string, status: AttendanceStatus, justificationNote?: string) => {
      setAttendanceDrafts((prev) => {
        const existing = prev[enrollmentId];
        const serverItem = attendanceOverview.roster.find((r) => r.enrollmentId === enrollmentId);
        return {
          ...prev,
          [enrollmentId]: {
            status,
            justificationNote:
              justificationNote !== undefined
                ? justificationNote
                : (existing?.justificationNote ?? serverItem?.justificationNote ?? ""),
          },
        };
      });
    },
    [attendanceOverview.roster],
  );

  const handleSetAttendanceJustification = useCallback(
    (enrollmentId: string, justificationNote: string) => {
      setAttendanceDrafts((prev) => {
        const existing = prev[enrollmentId];
        const serverItem = attendanceOverview.roster.find((r) => r.enrollmentId === enrollmentId);
        const currentStatus = existing?.status ?? serverItem?.status ?? "Present";
        return {
          ...prev,
          [enrollmentId]: {
            status: currentStatus,
            justificationNote,
          },
        };
      });
    },
    [attendanceOverview.roster],
  );

  const handleMarkAllPresent = useCallback(() => {
    const nextDrafts: Record<string, AttendanceDraftEntry> = {};
    for (const item of attendanceOverview.roster) {
      nextDrafts[item.enrollmentId] = {
        status: "Present",
        justificationNote: item.justificationNote ?? "",
      };
    }
    setAttendanceDrafts(nextDrafts);
  }, [attendanceOverview.roster]);

  const handleSaveAttendanceBatch = useCallback(async () => {
    const targetSectionId = attendanceOverview.selectedSectionId || selectedSectionId;
    if (!targetSectionId) {
      setFeedback({
        tone: "error",
        title: "Sección requerida",
        detail: "Selecciona una sección activa antes de guardar la asistencia.",
      });
      return false;
    }

    const entriesToSubmit = effectiveAttendanceRoster
      .filter((r) => r.effectiveStatus !== null)
      .map((r) => ({
        enrollmentId: r.enrollmentId,
        status: r.effectiveStatus as AttendanceStatus,
        justificationNote: r.effectiveJustificationNote.trim() || null,
      }));

    if (entriesToSubmit.length === 0) {
      setFeedback({
        tone: "error",
        title: "Sin estados seleccionados",
        detail:
          "Marca el estado de asistencia de al menos un estudiante o usa 'Marcar todos presentes'.",
      });
      return false;
    }

    setIsSubmitting(true);
    setFeedback(null);
    try {
      const res = await recordSectionAttendanceBatch(
        {
          sectionId: targetSectionId,
          attendanceDate: selectedDate,
          entries: entriesToSubmit,
        },
        csrfToken,
      );

      if (!res.ok) {
        setFeedback({
          tone: "error",
          title: res.problem.title || "No se pudo guardar la asistencia",
          detail:
            res.problem.detail ||
            "Verifica los permisos de registro de asistencia e inténtalo de nuevo.",
        });
        return false;
      }

      await refreshWorkspace();
      setFeedback({
        tone: "success",
        title: "Pase de lista guardado",
        detail: `Se procesaron ${res.data.processedCount} registros de asistencia (${res.data.createdCount} nuevos, ${res.data.updatedCount} actualizados).`,
      });
      return true;
    } finally {
      setIsSubmitting(false);
    }
  }, [
    attendanceOverview.selectedSectionId,
    selectedSectionId,
    effectiveAttendanceRoster,
    selectedDate,
    csrfToken,
    refreshWorkspace,
  ]);

  // --- Grading Logic ---
  const effectiveGradebookRows = useMemo(() => {
    const minPass = gradingOverview.metrics.minPassingScore || 70;
    return gradingOverview.gradebookRows.map((row) => {
      const draft = gradeDrafts[row.enrollmentId];
      const rawScoreStr =
        draft !== undefined
          ? draft.numericScore
          : row.numericScore !== null
            ? String(row.numericScore)
            : "";
      const parsedNum = rawScoreStr.trim() !== "" ? Number(rawScoreStr) : null;
      const validNum = parsedNum !== null && !Number.isNaN(parsedNum) ? parsedNum : null;

      const requiresCorrectionReason =
        (row.status === "Approved" || row.status === "Published") &&
        validNum !== null &&
        validNum !== row.numericScore;

      return {
        ...row,
        draftScoreInput: rawScoreStr,
        effectiveScore: validNum,
        effectiveIsPassing: validNum !== null ? validNum >= minPass : null,
        draftCorrectionReason:
          draft !== undefined ? draft.correctionReason : (row.correctionReason ?? ""),
        requiresCorrectionReason,
        isDirty: draft !== undefined,
      };
    });
  }, [gradingOverview.gradebookRows, gradingOverview.metrics.minPassingScore, gradeDrafts]);

  const handleSetGradeDraftScore = useCallback(
    (enrollmentId: string, numericScore: string) => {
      setGradeDrafts((prev) => {
        const existing = prev[enrollmentId];
        const serverRow = gradingOverview.gradebookRows.find(
          (r) => r.enrollmentId === enrollmentId,
        );
        return {
          ...prev,
          [enrollmentId]: {
            numericScore,
            correctionReason: existing?.correctionReason ?? serverRow?.correctionReason ?? "",
          },
        };
      });
    },
    [gradingOverview.gradebookRows],
  );

  const handleSetGradeCorrectionReason = useCallback(
    (enrollmentId: string, correctionReason: string) => {
      setGradeDrafts((prev) => {
        const existing = prev[enrollmentId];
        const serverRow = gradingOverview.gradebookRows.find(
          (r) => r.enrollmentId === enrollmentId,
        );
        return {
          ...prev,
          [enrollmentId]: {
            numericScore:
              existing?.numericScore ??
              (serverRow?.numericScore !== null && serverRow?.numericScore !== undefined
                ? String(serverRow.numericScore)
                : ""),
            correctionReason,
          },
        };
      });
    },
    [gradingOverview.gradebookRows],
  );

  const handleCreateEvaluationPolicy = useCallback(
    async (values: CreateEvaluationPolicyFormValues) => {
      setIsSubmitting(true);
      setFeedback(null);
      try {
        const res = await createEvaluationPolicy(
          {
            academicYearId: values.academicYearId,
            policyCode: values.policyCode.trim().toUpperCase(),
            versionNumber: values.versionNumber,
            name: values.name.trim(),
            minPassingScore: values.minPassingScore,
            enabledPeriods: ["P1", "P2", "P3", "P4", "FINAL"],
            notes: values.notes?.trim() || null,
            isValidatedWithPilotSchool: values.isValidatedWithPilotSchool,
          },
          csrfToken,
        );

        if (!res.ok) {
          setFeedback({
            tone: "error",
            title: res.problem.title || "Error al crear la política",
            detail:
              res.problem.detail ||
              "Verifica que el código y versión no estén duplicados en el año escolar.",
          });
          return false;
        }

        await refreshWorkspace();
        setFeedback({
          tone: "success",
          title: "Política de evaluación configurada",
          detail: `Se activó '${res.data.name}' (${res.data.policyCode} v${res.data.versionNumber}) con mínimo aprobatorio de ${res.data.minPassingScore} pts.`,
        });
        return true;
      } finally {
        setIsSubmitting(false);
      }
    },
    [csrfToken, refreshWorkspace],
  );

  const handleSaveGradesBatch = useCallback(async () => {
    const targetSectionId = gradingOverview.selectedSectionId || selectedSectionId;
    const targetSubjectId = gradingOverview.selectedSubjectId || selectedSubjectId;
    const activePolicyId = gradingOverview.activePolicy?.id;

    if (!targetSectionId || !targetSubjectId) {
      setFeedback({
        tone: "error",
        title: "Sección y asignatura requeridas",
        detail:
          "Selecciona una sección y una asignatura antes de guardar el acta de calificaciones.",
      });
      return false;
    }

    if (!activePolicyId) {
      setFeedback({
        tone: "error",
        title: "Política de evaluación requerida",
        detail: "Configura primero una versión de Política de Evaluación para este año escolar.",
      });
      return false;
    }

    const rowsWithScores = effectiveGradebookRows.filter((r) => r.draftScoreInput.trim() !== "");

    if (rowsWithScores.length === 0) {
      setFeedback({
        tone: "error",
        title: "Sin calificaciones para guardar",
        detail: "Ingresa al menos una calificación numérica entre 0 y 100.",
      });
      return false;
    }

    for (const row of rowsWithScores) {
      if (row.effectiveScore === null || row.effectiveScore < 0 || row.effectiveScore > 100) {
        setFeedback({
          tone: "error",
          title: "Calificación fuera de rango",
          detail: `La nota de ${row.studentFullName} debe estar entre 0 y 100 puntos.`,
        });
        return false;
      }

      if (row.requiresCorrectionReason && row.draftCorrectionReason.trim().length < 5) {
        setFeedback({
          tone: "error",
          title: "Motivo de corrección obligatorio",
          detail: `Para modificar la nota ya aprobada/publicada de ${row.studentFullName}, indica un motivo de al menos 5 caracteres.`,
        });
        return false;
      }
    }

    setIsSubmitting(true);
    setFeedback(null);
    try {
      const res = await recordSectionGradesBatch(
        {
          sectionId: targetSectionId,
          subjectId: targetSubjectId,
          evaluationPolicyVersionId: activePolicyId,
          periodCode: selectedPeriodCode,
          grades: rowsWithScores.map((r) => ({
            enrollmentId: r.enrollmentId,
            numericScore: r.effectiveScore!,
            correctionReason: r.draftCorrectionReason.trim() || null,
          })),
        },
        csrfToken,
      );

      if (!res.ok) {
        setFeedback({
          tone: "error",
          title: res.problem.title || "No se pudieron guardar las calificaciones",
          detail: res.problem.detail || "Verifica los datos ingresados e inténtalo nuevamente.",
        });
        return false;
      }

      await refreshWorkspace();
      setFeedback({
        tone: "success",
        title: "Acta de calificaciones actualizada",
        detail: `Se guardaron ${res.data.processedCount} calificaciones en el período ${res.data.periodCode} (${res.data.createdCount} nuevas, ${res.data.updatedCount} actualizadas).`,
      });
      return true;
    } finally {
      setIsSubmitting(false);
    }
  }, [
    gradingOverview.selectedSectionId,
    gradingOverview.selectedSubjectId,
    gradingOverview.activePolicy?.id,
    selectedSectionId,
    selectedSubjectId,
    effectiveGradebookRows,
    selectedPeriodCode,
    csrfToken,
    refreshWorkspace,
  ]);

  const handleApproveGradeEntry = useCallback(
    async (gradeEntryId: string) => {
      setIsSubmitting(true);
      setFeedback(null);
      try {
        const res = await approveGradeEntry(gradeEntryId, csrfToken);
        if (!res.ok) {
          setFeedback({
            tone: "error",
            title: res.problem.title || "No se pudo aprobar la calificación",
            detail:
              res.problem.detail ||
              "Recuerda la regla de separación de funciones: quien registra una nota no puede auto-aprobarla.",
          });
          return false;
        }

        await refreshWorkspace();
        setFeedback({
          tone: "success",
          title: "Calificación aprobada oficialmente",
          detail: `El registro del período ${res.data.periodCode} (${res.data.numericScore} pts) quedó aprobado.`,
        });
        return true;
      } finally {
        setIsSubmitting(false);
      }
    },
    [csrfToken, refreshWorkspace],
  );

  // --- Report Cards Logic ---
  const selectedSnapshot: ReportCardSnapshotDto | null = useMemo(() => {
    if (reportCardsOverview.snapshots.length === 0) {
      return null;
    }
    if (selectedSnapshotId) {
      const found = reportCardsOverview.snapshots.find((s) => s.id === selectedSnapshotId);
      if (found) {
        return found;
      }
    }
    return reportCardsOverview.snapshots[0] ?? null;
  }, [reportCardsOverview.snapshots, selectedSnapshotId]);

  const selectedSnapshotPayload = useMemo(() => {
    if (!selectedSnapshot) {
      return null;
    }
    return parseReportCardPayload(selectedSnapshot.immutablePayloadJson);
  }, [selectedSnapshot]);

  const handlePublishReportCard = useCallback(
    async (values: PublishReportCardFormValues) => {
      setIsSubmitting(true);
      setFeedback(null);
      try {
        const res = await publishReportCard(
          {
            enrollmentId: values.enrollmentId,
            evaluationPolicyVersionId: values.evaluationPolicyVersionId,
            periodCode: values.periodCode,
            correctionReason: values.correctionReason?.trim() || null,
          },
          csrfToken,
        );

        if (!res.ok) {
          setFeedback({
            tone: "error",
            title: res.problem.title || "No se pudo emitir el boletín",
            detail:
              res.problem.detail ||
              "Verifica que el estudiante tenga calificaciones registradas en el período.",
          });
          return false;
        }

        await refreshWorkspace();
        setSelectedSnapshotId(res.data.id);
        setFeedback({
          tone: "success",
          title:
            res.data.versionNumber === 1
              ? "Boletín oficial v1 publicado"
              : `Boletín rectificado v${res.data.versionNumber} publicado`,
          detail: `Se generó la instantánea histórica inmutable v${res.data.versionNumber} para ${res.data.studentFullName} (${res.data.periodCode}).`,
        });
        return true;
      } finally {
        setIsSubmitting(false);
      }
    },
    [csrfToken, refreshWorkspace],
  );

  return {
    handleRefresh: async () => {
      if (confirmContextChange()) await refreshWorkspace();
    },
    activeTab,
    setActiveTab,
    academicYears: initialAcademicOverview.academicYears,
    availableSections,
    subjects: initialAcademicOverview.subjects,
    selectedAcademicYearId,
    selectedSectionId,
    selectedSubjectId,
    selectedPeriodCode,
    selectedDate,
    handleAcademicYearChange,
    handleSectionChange,
    handleSubjectChange,
    handlePeriodChange,
    handleDateChange,
    attendanceOverview,
    effectiveAttendanceRoster,
    handleSetStudentAttendance,
    handleSetAttendanceJustification,
    handleMarkAllPresent,
    handleSaveAttendanceBatch,
    gradingOverview,
    effectiveGradebookRows,
    handleSetGradeDraftScore,
    handleSetGradeCorrectionReason,
    handleCreateEvaluationPolicy,
    handleSaveGradesBatch,
    handleApproveGradeEntry,
    reportCardsOverview,
    selectedSnapshot,
    selectedSnapshotPayload,
    setSelectedSnapshotId,
    handlePublishReportCard,
    isLoadingFilters,
    isSubmitting,
    feedback,
    dismissFeedback,
  };
}

export type EvaluationsState = ReturnType<typeof useEvaluationsWorkspace>;
