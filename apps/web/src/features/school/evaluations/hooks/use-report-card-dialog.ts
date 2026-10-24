"use client";
import { useState } from "react";
import type { StudentReportCardReadinessDto } from "@/lib/api/types";
import type { EvaluationsState } from "./use-evaluations-workspace";
export function useReportCardDialog(state: EvaluationsState) {
  const [student, setStudent] = useState<StudentReportCardReadinessDto | null>(null),
    [reason, setReason] = useState(""),
    [error, setError] = useState<string | null>(null),
    [historyStudent, setHistoryStudent] = useState<string | null>(null);
  const open = (value: StudentReportCardReadinessDto) => {
    setStudent(value);
    setReason("");
    setError(null);
  };
  const publish = async () => {
    if (!student || !state.reportCardsOverview.activeEvaluationPolicyVersionId) return;
    if (student.latestPublishedVersion > 0 && reason.trim().length < 10) {
      setError("Indica un motivo de rectificación de al menos 10 caracteres.");
      return;
    }
    const ok = await state.handlePublishReportCard({
      enrollmentId: student.enrollmentId,
      evaluationPolicyVersionId: state.reportCardsOverview.activeEvaluationPolicyVersionId,
      periodCode: state.selectedPeriodCode,
      isRectification: student.latestPublishedVersion > 0,
      correctionReason: reason.trim(),
    });
    if (ok) setStudent(null);
  };
  const history = state.reportCardsOverview.snapshots.filter(
    (snapshot) => !historyStudent || snapshot.studentId === historyStudent,
  );
  return {
    student,
    reason,
    setReason,
    error,
    open,
    publish,
    close: () => setStudent(null),
    historyStudent,
    setHistoryStudent,
    history,
  };
}
