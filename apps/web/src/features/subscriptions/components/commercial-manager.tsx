"use client";
import { FeedbackBanner } from "@/components/shared/feedback-banner";
import { SectionCard } from "@/components/shared/section-card";
import { RefreshButton } from "@/components/shared/refresh-button";
import { useCommercialManager } from "../hooks/use-commercial-manager";
import {
  statusLabels,
  type PlanVersion,
  type ProductModule,
  type SubscriptionOverview,
} from "../schemas/subscription-schemas";
import { PlanForm } from "./plan-form";
import { SubscriptionForm } from "./subscription-form";
export function CommercialManager({
  plans,
  modules,
  initial = null,
  institutionId,
  csrfToken,
}: {
  plans: PlanVersion[];
  modules: ProductModule[];
  initial?: SubscriptionOverview | null;
  institutionId?: string;
  csrfToken: string;
}) {
  const s = useCommercialManager(plans, initial, institutionId, csrfToken);
  return (
    <div className="space-y-6">
      <FeedbackBanner
        problem={s.problem}
        successTitle="Operación completada"
        successMessage={s.success}
      />
      <SectionCard
        title={institutionId ? "Suscripción y módulos" : "Planes comerciales"}
        headerAction={<RefreshButton loading={s.busy} onClick={s.refresh} />}
      >
        {s.data ? (
          <>
            <p className="font-semibold">
              {statusLabels[s.data.access.status]} ·{" "}
              {s.data.plan
                ? `${s.data.plan.name} v${s.data.plan.revision}`
                : "Asigne un plan para habilitar cambios"}
            </p>
            <p className="mt-2 text-sm">
              Límite de estudiantes activos: {s.data.access.maxActiveStudents ?? "Sin límite"} ·
              Secciones totales: {s.data.access.maxSections ?? "Sin límite"}
            </p>
            <ul className="mt-4 grid gap-3 md:grid-cols-2">
              {s.data.access.modules.map((m) => (
                <li key={m.code} className="rounded border p-3 text-sm">
                  <strong>{m.name}</strong>
                  <p>{m.canWrite ? "Habilitado para operar" : m.reason}</p>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="text-sm text-slate-500">
            Cree versiones y asígnelas desde la ficha de cada colegio.
          </p>
        )}
      </SectionCard>
      {institutionId ? (
        <SubscriptionForm
          form={s.subscriptionForm}
          plans={s.plans}
          modules={modules}
          overrides={s.overrides}
          onOverride={s.setOverride}
          busy={s.busy}
          onSubmit={s.saveSubscription}
        />
      ) : null}
      <SectionCard title="Versiones disponibles">
        {s.plans.length === 0 ? (
          <p className="text-sm text-slate-500">
            Todavía no hay planes. Cree el primero con sus condiciones reales.
          </p>
        ) : (
          <ul className="space-y-3">
            {s.plans.map((p) => (
              <li key={p.id} className="rounded border p-3 text-sm">
                <strong>
                  {p.name} · v{p.revision}
                </strong>
                <p>{p.description}</p>
                <p>
                  {p.price === null ? "Precio no definido" : `${p.price.toFixed(2)} ${p.currency}`}{" "}
                  ·{" "}
                  {
                    (
                      { Monthly: "Mensual", Annual: "Anual", Custom: "Personalizada" } as Record<
                        string,
                        string
                      >
                    )[p.billingPeriod]
                  }
                </p>
                <p>
                  Estudiantes activos: {p.maxActiveStudents ?? "Sin límite"} · Secciones:{" "}
                  {p.maxSections ?? "Sin límite"}
                </p>
                <p>
                  Módulos:{" "}
                  {p.modules
                    .map((code) => modules.find((m) => m.code === code)?.name ?? code)
                    .join(", ") || "Ninguno"}
                </p>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
      <PlanForm form={s.planForm} modules={modules} busy={s.busy} onSubmit={s.savePlan} />
    </div>
  );
}
