"use client";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createEvaluationPolicySchema,
  type CreateEvaluationPolicyFormValues,
} from "../schemas/evaluations-schemas";
import type { EvaluationsState } from "./use-evaluations-workspace";
export function useEvaluationPolicyForm(state: EvaluationsState) {
  const router = useRouter();
  const form = useForm<CreateEvaluationPolicyFormValues>({
    resolver: zodResolver(createEvaluationPolicySchema),
    defaultValues: {
      academicYearId: state.selectedAcademicYearId,
      policyCode: "",
      versionNumber: (state.gradingOverview.policies[0]?.versionNumber ?? 0) + 1,
      name: "",
      minPassingScore: 70,
      notes: "",
      isValidatedWithPilotSchool: false,
    },
  });
  const submit = form.handleSubmit(async (values) => {
    if (await state.handleCreateEvaluationPolicy(values)) router.push("/settings/policies");
  });
  return { form, submit };
}
