import { bffFetch } from "@/lib/api/bff-client";
import type {
  PlanVersion,
  PlanValues,
  SubscriptionOverview,
  SubscriptionValues,
} from "../schemas/subscription-schemas";
export const listPlans = () => bffFetch<PlanVersion[]>("platform/plans");
export const getSubscription = (id: string) =>
  bffFetch<SubscriptionOverview>(`platform/institutions/${encodeURIComponent(id)}/subscription`);
export const createPlan = (values: PlanValues, csrfToken: string) =>
  bffFetch<PlanVersion>("platform/plans", {
    method: "POST",
    csrfToken,
    body: {
      ...values,
      revision: Number(values.revision),
      price: values.price === "" ? null : Number(values.price),
      currency: values.currency || null,
      maxActiveStudents: values.maxActiveStudents === "" ? null : Number(values.maxActiveStudents),
      maxSections: values.maxSections === "" ? null : Number(values.maxSections),
    },
  });
export const assignSubscription = (
  id: string,
  values: SubscriptionValues,
  overrides: { code: string; enabled: boolean }[],
  version: number | null,
  csrfToken: string,
) =>
  bffFetch<SubscriptionOverview>(`platform/institutions/${encodeURIComponent(id)}/subscription`, {
    method: "PUT",
    csrfToken,
    body: {
      ...values,
      startsAtUtc: new Date(values.startsAtUtc).toISOString(),
      endsAtUtc: new Date(values.endsAtUtc).toISOString(),
      overrides,
      version,
    },
  });
