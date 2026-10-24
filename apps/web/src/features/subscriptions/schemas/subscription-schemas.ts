import { z } from "zod";
export type ProductModule = {
  code: string;
  name: string;
  dependencies: string[];
  available: boolean;
};
export type ModuleAccess = {
  code: string;
  name: string;
  canRead: boolean;
  canWrite: boolean;
  reason: string | null;
};
export type EffectiveAccess = {
  status: string;
  endsAtUtc: string | null;
  maxActiveStudents: number | null;
  maxSections: number | null;
  modules: ModuleAccess[];
};
export type PlanVersion = {
  id: string;
  code: string;
  name: string;
  description: string;
  revision: number;
  price: number | null;
  currency: string | null;
  billingPeriod: string;
  maxActiveStudents: number | null;
  maxSections: number | null;
  modules: string[];
};
export type Subscription = {
  id: string;
  planVersionId: string;
  startsAtUtc: string;
  endsAtUtc: string;
  status: string;
  reason: string;
  overrides: { code: string; enabled: boolean }[];
  version: number;
};
export type SubscriptionOverview = {
  subscription: Subscription | null;
  plan: PlanVersion | null;
  access: EffectiveAccess;
};
export const statusLabels: Record<string, string> = {
  Configured: "Módulos configurados",
  Active: "Activa",
  Suspended: "Suspendida",
  Cancelled: "Cancelada",
  Expired: "Vencida",
  Scheduled: "Programada",
  Unassigned: "Sin suscripción",
};
const optionalLimit = z
  .string()
  .refine(
    (v) => v === "" || (/^\d+$/.test(v) && Number(v) > 0 && Number(v) <= 2147483647),
    "Use un entero positivo o deje vacío para no limitar.",
  );
export const planSchema = z
  .object({
    code: z
      .string()
      .regex(/^[a-zA-Z0-9_-]{1,40}$/, "Código de hasta 40 letras, números o guiones."),
    name: z.string().trim().min(1, "Indique un nombre.").max(120),
    description: z.string().max(2000),
    revision: z.string().regex(/^[1-9]\d*$/, "Versión entera positiva."),
    price: z
      .string()
      .refine(
        (v) => v === "" || (/^\d+(\.\d{1,2})?$/.test(v) && Number(v) <= 999999999),
        "Precio válido con hasta dos decimales.",
      ),
    currency: z.string(),
    billingPeriod: z.enum(["Monthly", "Annual", "Custom"]),
    maxActiveStudents: optionalLimit,
    maxSections: optionalLimit,
    modules: z.array(z.string()),
  })
  .refine((v) => !v.price || /^[A-Z]{3}$/.test(v.currency), {
    path: ["currency"],
    message: "Indique moneda de tres letras, por ejemplo DOP.",
  });
export type PlanValues = z.infer<typeof planSchema>;
export const subscriptionSchema = z
  .object({
    planVersionId: z.string().uuid("Seleccione un plan."),
    startsAtUtc: z.string().min(1, "Indique inicio."),
    endsAtUtc: z.string().min(1, "Indique fin."),
    status: z.enum(["Active", "Suspended", "Cancelled"]),
    reason: z.string().trim().min(1, "Indique el motivo del cambio.").max(1000),
  })
  .refine((v) => Date.parse(v.endsAtUtc) > Date.parse(v.startsAtUtc), {
    path: ["endsAtUtc"],
    message: "El fin debe ser posterior al inicio.",
  });
export type SubscriptionValues = z.infer<typeof subscriptionSchema>;
export const emptyPlan: PlanValues = {
  code: "",
  name: "",
  description: "",
  revision: "1",
  price: "",
  currency: "",
  billingPeriod: "Custom",
  maxActiveStudents: "",
  maxSections: "",
  modules: [],
};
export function localDateTime(value: string | undefined) {
  if (!value) return "";
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}
