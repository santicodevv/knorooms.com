import type { UseFormReturn } from "react-hook-form";
import { PlusCircle } from "lucide-react";
import { FormFieldError } from "@/components/shared/form-field-error";
import { SectionCard } from "@/components/shared/section-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CreateInstitutionFormValues } from "@/features/platform/schemas/platform-schemas";

interface CreateInstitutionFormCardProps {
  form: UseFormReturn<CreateInstitutionFormValues>;
  baseDomain: string;
  onSubmit: (values: CreateInstitutionFormValues) => Promise<void>;
}

export function CreateInstitutionFormCard({
  form,
  baseDomain,
  onSubmit,
}: CreateInstitutionFormCardProps) {
  return (
    <SectionCard
      icon={<PlusCircle className="size-5 text-slate-800" />}
      title="Registrar Nueva Institución"
      description={
        <>
          Crea un nuevo tenant aislado en{" "}
          <code className="font-mono">POST /api/platform/institutions</code>.
        </>
      }
    >
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="inst-name">Nombre Oficial del Colegio</Label>
          <Input
            id="inst-name"
            placeholder="Ej. Colegio Dominicano San Miguel"
            {...form.register("name")}
          />
          <FormFieldError message={form.formState.errors.name?.message} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="inst-slug">Subdominio Institucional (Slug)</Label>
          <div className="flex items-center gap-2">
            <Input id="inst-slug" placeholder="colegio-a" {...form.register("slug")} />
            <span className="shrink-0 font-mono text-xs text-slate-500">.{baseDomain}</span>
          </div>
          <FormFieldError message={form.formState.errors.slug?.message} />
        </div>

        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Registrando institución..." : "Crear Institución"}
        </Button>
      </form>
    </SectionCard>
  );
}
