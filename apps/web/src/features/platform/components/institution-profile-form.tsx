import type { UseFormReturn } from "react-hook-form";
import { SectionCard } from "@/components/shared/section-card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import type { InstitutionProfileValues } from "../schemas/institution-setup-schemas";
const fields = [
  ["name", "Nombre del colegio", 160],
  ["contactName", "Persona de contacto", 160],
  ["contactEmail", "Correo de contacto", 320],
  ["phone", "Teléfono", 40],
  ["address", "Dirección", 500],
  ["centerCode", "Código del centro (opcional)", 50],
  ["logoUrl", "Dirección HTTPS del logo (opcional)", 1000],
  ["timeZoneId", "Zona horaria", 64],
  ["onboardingOwner", "Responsable de acompañamiento", 160],
] as const;
export function InstitutionProfileForm({
  form,
  onSubmit,
  busy,
}: {
  form: UseFormReturn<InstitutionProfileValues>;
  onSubmit: () => void;
  busy: boolean;
}) {
  return (
    <SectionCard
      title="Datos del colegio"
      description="El subdominio se conserva para mantener los accesos y el historial."
    >
      <form onSubmit={onSubmit} className="space-y-5">
        <fieldset disabled={busy} className="grid gap-4 md:grid-cols-2">
          {fields.map(([key, label, maxLength]) => (
            <div key={key} className="space-y-1.5">
              <Label htmlFor={key}>{label}</Label>
              <Input id={key} maxLength={maxLength} {...form.register(key)} />
              {form.formState.errors[key] && (
                <p className="text-sm text-red-700">{form.formState.errors[key]?.message}</p>
              )}
            </div>
          ))}
        </fieldset>
        <div className="space-y-2">
          <Label htmlFor="onboardingNotes">Notas del acompañamiento</Label>
          <textarea
            id="onboardingNotes"
            maxLength={2000}
            disabled={busy}
            className="min-h-24 w-full rounded-md border p-3 text-sm"
            {...form.register("onboardingNotes")}
          />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" disabled={busy} {...form.register("welcomeMeetingCompleted")} />
          Reunión inicial realizada
        </label>
        <Button disabled={busy} type="submit">
          {busy ? "Procesando…" : "Guardar ficha"}
        </Button>
      </form>
    </SectionCard>
  );
}
