"use client";
import type { UseFormReturn } from "react-hook-form";
import { SectionCard } from "@/components/shared/section-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type {
  PlanVersion,
  ProductModule,
  SubscriptionValues,
} from "../schemas/subscription-schemas";
export function SubscriptionForm({
  form,
  plans,
  modules,
  overrides,
  onOverride,
  busy,
  onSubmit,
}: {
  form: UseFormReturn<SubscriptionValues>;
  plans: PlanVersion[];
  modules: ProductModule[];
  overrides: Record<string, string>;
  onOverride: (code: string, value: string) => void;
  busy: boolean;
  onSubmit: React.FormEventHandler<HTMLFormElement>;
}) {
  return (
    <SectionCard
      title="Condiciones del colegio"
      description="Al vencer o suspender, se conserva la consulta histórica. Los cambios quedan bloqueados y los datos se mantienen."
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <fieldset disabled={busy} className="grid gap-4 md:grid-cols-2">
          <label className="text-sm">
            Plan y versión
            <select
              {...form.register("planVersionId")}
              className="mt-1 block w-full rounded border p-2"
            >
              <option value="">Seleccione un plan</option>
              {plans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} · v{p.revision} ({p.code})
                </option>
              ))}
            </select>
            <span className="text-red-600">{form.formState.errors.planVersionId?.message}</span>
          </label>
          <label className="text-sm">
            Estado
            <select {...form.register("status")} className="mt-1 block w-full rounded border p-2">
              <option value="Active">Activa</option>
              <option value="Suspended">Suspendida</option>
              <option value="Cancelled">Cancelada</option>
            </select>
          </label>
          {(
            [
              ["startsAtUtc", "Inicio (hora local)"],
              ["endsAtUtc", "Fin exclusivo (hora local)"],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="text-sm">
              {label}
              <Input type="datetime-local" {...form.register(key)} />
              <span className="text-red-600">{form.formState.errors[key]?.message}</span>
            </label>
          ))}
          <label className="text-sm md:col-span-2">
            Motivo del cambio
            <Input {...form.register("reason")} />
            <span className="text-red-600">{form.formState.errors.reason?.message}</span>
          </label>
          <div className="md:col-span-2">
            <h3 className="mb-2 text-sm font-semibold">Excepciones por colegio</h3>
            <p className="mb-3 text-xs text-slate-500">
              Deshabilitar una dependencia bloquea también los módulos que la requieren. Moodle no
              se activa hasta su implementación.
            </p>
            <div className="grid gap-3 md:grid-cols-2">
              {modules.map((m) => (
                <label key={m.code} className="text-sm">
                  {m.name}
                  <select
                    aria-label={`Excepción de ${m.name}`}
                    value={overrides[m.code] ?? "inherit"}
                    onChange={(e) => onOverride(m.code, e.target.value)}
                    className="mt-1 block w-full rounded border p-2"
                  >
                    <option value="inherit">Según el plan</option>
                    <option value="enabled">Habilitar</option>
                    <option value="disabled">Deshabilitar</option>
                  </select>
                </label>
              ))}
            </div>
          </div>
        </fieldset>
        <Button type="submit" disabled={busy || plans.length === 0}>
          Guardar suscripción
        </Button>
      </form>
    </SectionCard>
  );
}
