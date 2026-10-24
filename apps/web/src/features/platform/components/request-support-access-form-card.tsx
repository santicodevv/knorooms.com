import type { UseFormReturn } from "react-hook-form";
import { ShieldAlert } from "lucide-react";
import { FormFieldError } from "@/components/shared/form-field-error";
import { SectionCard } from "@/components/shared/section-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AVAILABLE_SUPPORT_PERMISSIONS,
  type SupportAccessRequestFormValues,
} from "@/features/platform/schemas/platform-schemas";
import type { InstitutionDto } from "@/lib/api/types";

interface RequestSupportAccessFormCardProps {
  form: UseFormReturn<SupportAccessRequestFormValues>;
  institutions: InstitutionDto[];
  selectedPermissions: string[];
  onTogglePermission: (code: string) => void;
  onSubmit: (values: SupportAccessRequestFormValues) => Promise<void>;
}

export function RequestSupportAccessFormCard({
  form,
  institutions,
  selectedPermissions,
  onTogglePermission,
  onSubmit,
}: RequestSupportAccessFormCardProps) {
  return (
    <SectionCard
      icon={<ShieldAlert className="size-5 text-amber-700" />}
      title="Solicitar Acceso Temporal de Soporte"
      description="El soporte técnico requiere aprobación explícita del colegio y expira automáticamente."
    >
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="support-tenant">Institución Destino</Label>
          <select
            id="support-tenant"
            className="border-control flex h-9 w-full rounded-md border bg-white px-3 py-1 text-sm text-slate-900 shadow-xs focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:outline-none"
            {...form.register("tenantId")}
          >
            <option value="">Seleccione un colegio...</option>
            {institutions.map((inst) => (
              <option key={inst.id} value={inst.id}>
                {inst.name} ({inst.slug})
              </option>
            ))}
          </select>
          <FormFieldError message={form.formState.errors.tenantId?.message} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="support-reason">Motivo Auditado</Label>
          <textarea
            id="support-reason"
            rows={3}
            placeholder="Ej. Ticket #1042: Revisión de permisos solicitada por dirección académica."
            className="border-control flex w-full rounded-md border bg-white px-3 py-2 text-sm text-slate-900 shadow-xs focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:outline-none"
            {...form.register("reason")}
          />
          <FormFieldError message={form.formState.errors.reason?.message} />
        </div>

        <div className="space-y-2">
          <Label>Permisos Solicitados</Label>
          <div className="space-y-1.5 rounded-md border border-slate-200 bg-slate-50/70 p-3">
            {AVAILABLE_SUPPORT_PERMISSIONS.map((perm) => {
              const checked = selectedPermissions.includes(perm.code);
              return (
                <label
                  key={perm.code}
                  className="flex cursor-pointer items-start gap-2 text-xs text-slate-700"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => onTogglePermission(perm.code)}
                    className="mt-0.5 rounded border-slate-300"
                  />
                  <span>{perm.label}</span>
                </label>
              );
            })}
          </div>
          <FormFieldError message={form.formState.errors.permissions?.message} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="support-duration">Duración (minutos, 15 – 1440)</Label>
          <Input
            id="support-duration"
            type="number"
            min={15}
            max={1440}
            step={15}
            {...form.register("durationMinutes", { valueAsNumber: true })}
          />
          <FormFieldError message={form.formState.errors.durationMinutes?.message} />
        </div>

        <Button
          type="submit"
          variant="outline"
          className="w-full"
          disabled={form.formState.isSubmitting || institutions.length === 0}
        >
          {form.formState.isSubmitting ? "Enviando solicitud..." : "Enviar Solicitud de Soporte"}
        </Button>
      </form>
    </SectionCard>
  );
}
