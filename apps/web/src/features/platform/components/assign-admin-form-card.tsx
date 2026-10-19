import type { UseFormReturn } from "react-hook-form";
import { UserPlus } from "lucide-react";
import { FormFieldError } from "@/components/shared/form-field-error";
import { SectionCard } from "@/components/shared/section-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AssignAdminFormValues } from "@/features/platform/schemas/platform-schemas";
import type { InstitutionDto } from "@/lib/api/types";

interface AssignAdminFormCardProps {
  form: UseFormReturn<AssignAdminFormValues>;
  institutions: InstitutionDto[];
  onSubmit: (values: AssignAdminFormValues) => Promise<void>;
}

export function AssignAdminFormCard({ form, institutions, onSubmit }: AssignAdminFormCardProps) {
  return (
    <SectionCard
      icon={<UserPlus className="size-5 text-slate-800" />}
      title="Asignar Administrador Inicial"
      description="Vincula el correo del director o administrador institucional al colegio seleccionado."
    >
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="admin-institution">Institución</Label>
          <select
            id="admin-institution"
            className="flex h-9 w-full rounded-md border border-slate-300 bg-white px-3 py-1 text-sm text-slate-900 shadow-xs focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:outline-none"
            {...form.register("institutionId")}
          >
            <option value="">Seleccione un colegio...</option>
            {institutions.map((inst) => (
              <option key={inst.id} value={inst.id}>
                {inst.name} ({inst.slug})
              </option>
            ))}
          </select>
          <FormFieldError message={form.formState.errors.institutionId?.message} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="admin-email">Correo Electrónico del Administrador</Label>
          <Input
            id="admin-email"
            type="email"
            placeholder="director@colegio-a.edu.do"
            {...form.register("email")}
          />
          <FormFieldError message={form.formState.errors.email?.message} />
        </div>

        <Button
          type="submit"
          variant="secondary"
          className="w-full"
          disabled={form.formState.isSubmitting || institutions.length === 0}
        >
          {form.formState.isSubmitting ? "Asignando rol..." : "Asignar Administrador"}
        </Button>
      </form>
    </SectionCard>
  );
}
