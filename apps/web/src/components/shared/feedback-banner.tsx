"use client";
import { useEffect, useId } from "react";
import toast from "react-hot-toast";
import { ProblemAlert } from "@/components/api/problem-alert";
import type { ProblemDetails } from "@/lib/api/types";
export function FeedbackBanner({
  successMessage,
  problem,
}: {
  successTitle?: string;
  successMessage: string | null;
  problem: ProblemDetails | null;
}) {
  const id = useId();
  useEffect(() => {
    if (successMessage) toast.success(successMessage, { id: `success-${id}` });
  }, [successMessage, id]);
  useEffect(() => {
    if (problem)
      toast.error(problem.detail ?? problem.title ?? "No se pudo completar la operación.", {
        id: `error-${id}`,
      });
  }, [problem, id]);
  return problem ? <ProblemAlert problem={problem} /> : null;
}
