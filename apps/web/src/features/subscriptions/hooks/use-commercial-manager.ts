"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { ProblemDetails } from "@/lib/api/types";
import {
  createPlan,
  assignSubscription,
  listPlans,
  getSubscription,
} from "../api/subscription-api";
import {
  emptyPlan,
  planSchema,
  subscriptionSchema,
  localDateTime,
  type PlanValues,
  type PlanVersion,
  type SubscriptionValues,
  type SubscriptionOverview,
} from "../schemas/subscription-schemas";
function defaults(data: SubscriptionOverview | null): SubscriptionValues {
  return {
    planVersionId: data?.subscription?.planVersionId ?? "",
    startsAtUtc: localDateTime(data?.subscription?.startsAtUtc),
    endsAtUtc: localDateTime(data?.subscription?.endsAtUtc),
    status: (data?.subscription?.status as SubscriptionValues["status"]) ?? "Active",
    reason: "",
  };
}
function overrideValues(data: SubscriptionOverview | null): Record<string, string> {
  return Object.fromEntries(
    (data?.subscription?.overrides ?? []).map((x) => [x.code, x.enabled ? "enabled" : "disabled"]),
  );
}
export function useCommercialManager(
  initialPlans: PlanVersion[],
  initial: SubscriptionOverview | null,
  institutionId: string | undefined,
  csrfToken: string,
) {
  const [plans, setPlans] = useState(initialPlans);
  const [data, setData] = useState(initial);
  const [overrides, setOverrides] = useState<Record<string, string>>(overrideValues(initial));
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<ProblemDetails | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const planForm = useForm<PlanValues>({
    resolver: zodResolver(planSchema),
    defaultValues: emptyPlan,
  });
  const subscriptionForm = useForm<SubscriptionValues>({
    resolver: zodResolver(subscriptionSchema),
    defaultValues: defaults(initial),
  });
  async function refresh() {
    setBusy(true);
    setProblem(null);
    try {
      const plansResult = await listPlans();
      if (plansResult.ok) setPlans(plansResult.data);
      else setProblem(plansResult.problem);
      if (institutionId) {
        const result = await getSubscription(institutionId);
        if (result.ok) {
          setData(result.data);
          subscriptionForm.reset(defaults(result.data));
          setOverrides(overrideValues(result.data));
        } else setProblem(result.problem);
      }
    } finally {
      setBusy(false);
    }
  }
  const savePlan = planForm.handleSubmit(async (values) => {
    setBusy(true);
    setProblem(null);
    setSuccess(null);
    try {
      const result = await createPlan(values, csrfToken);
      if (!result.ok) {
        setProblem(result.problem);
        return;
      }
      setPlans((previous) => [...previous, result.data]);
      setSuccess("Versión del plan creada. Los contratos existentes conservan sus condiciones.");
      planForm.reset(emptyPlan);
    } finally {
      setBusy(false);
    }
  });
  const saveSubscription = subscriptionForm.handleSubmit(async (values) => {
    if (!institutionId) return;
    setBusy(true);
    setProblem(null);
    setSuccess(null);
    try {
      const items = Object.entries(overrides)
        .filter(([, value]) => value !== "inherit")
        .map(([code, value]) => ({ code, enabled: value === "enabled" }));
      const result = await assignSubscription(
        institutionId,
        values,
        items,
        data?.subscription?.version ?? null,
        csrfToken,
      );
      if (!result.ok) {
        setProblem(result.problem);
        return;
      }
      setData(result.data);
      subscriptionForm.reset(defaults(result.data));
      setSuccess("Suscripción actualizada. Los derechos se aplican inmediatamente.");
    } finally {
      setBusy(false);
    }
  });
  return {
    plans,
    data,
    overrides,
    setOverride: (code: string, value: string) =>
      setOverrides((previous) => ({ ...previous, [code]: value })),
    busy,
    problem,
    success,
    planForm,
    subscriptionForm,
    savePlan,
    saveSubscription,
    refresh,
  };
}
