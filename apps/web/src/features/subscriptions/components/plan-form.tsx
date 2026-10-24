"use client";
import type { UseFormReturn } from "react-hook-form";
import { SectionCard } from "@/components/shared/section-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { PlanValues, ProductModule } from "../schemas/subscription-schemas";
export function PlanForm({
  form,
  modules,
  busy,
  onSubmit,
}: {
  form: UseFormReturn<PlanValues>;
  modules: ProductModule[];
  busy: boolean;
  onSubmit: React.FormEventHandler<HTMLFormElement>;
}) {
  return (
    <SectionCard
      title="Crear versión de plan"
      description="Cada versión conserva sus condiciones. Precio opcional e informativo; no realiza cobros. Los límites vacíos significan sin límite."
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <fieldset disabled={busy} className="grid gap-4 md:grid-cols-2">
          {(
            [
              ["code", "Código del plan"],
              ["name", "Nombre"],
              ["revision", "Versión"],
              ["description", "Descripción"],
              ["price", "Precio (opcional)"],
              ["currency", "Moneda (ej. DOP)"],
              ["maxActiveStudents", "Máximo de estudiantes activos"],
              ["maxSections", "Máximo total de secciones (todos los años)"],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="space-y-1 text-sm">
              {label}
              <Input {...form.register(key)} />
              <span className="text-red-600">{form.formState.errors[key]?.message}</span>
            </label>
          ))}
          <label className="text-sm">
            Periodicidad
            <select
              {...form.register("billingPeriod")}
              className="mt-1 block w-full rounded border p-2"
            >
              <option value="Custom">Personalizada</option>
              <option value="Monthly">Mensual</option>
              <option value="Annual">Anual</option>
            </select>
          </label>
          <div className="space-y-2">
            <p className="text-sm font-medium">Módulos incluidos</p>
            {modules.map((m) => (
              <label key={m.code} className="block text-sm">
                <input
                  type="checkbox"
                  value={m.code}
                  {...form.register("modules")}
                  className="mr-2"
                />
                {m.name}
                {!m.available ? " · Próxima etapa" : ""}
                {m.dependencies.length ? (
                  <span className="block text-xs text-slate-500">
                    Requiere:{" "}
                    {m.dependencies
                      .map((d) => modules.find((x) => x.code === d)?.name ?? d)
                      .join(", ")}
                  </span>
                ) : null}
              </label>
            ))}
          </div>
        </fieldset>
        <Button type="submit" disabled={busy}>
          Crear versión
        </Button>
      </form>
    </SectionCard>
  );
}
