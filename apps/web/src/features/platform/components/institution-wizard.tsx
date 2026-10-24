"use client";
import { ArrowLeft, ArrowRight, Check, ChevronRight, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PlatformPageHeading } from "./platform-page-heading";
import { InstitutionWizardSteps } from "./institution-wizard-steps";
import { InstitutionWizardReview } from "./institution-wizard-review";
import { InstitutionBasicFields } from "./institution-basic-fields";
import { ModuleSelector } from "./module-selector";
import { useInstitutionWizard } from "../hooks/use-institution-wizard";
import type { ProductModule } from "../schemas/institution-management-schemas";
export function InstitutionWizard({
  catalog,
  csrfToken,
  domain,
  back,
}: {
  catalog: ProductModule[];
  csrfToken: string;
  domain: string;
  back: string;
}) {
  const s = useInstitutionWizard(csrfToken, back);
  return (
    <>
      <PlatformPageHeading
        title="Nueva institución"
        description="Crea y configura un colegio en unos pocos pasos."
        breadcrumb={
          <>
            <button onClick={s.cancel}>Instituciones</button>
            <ChevronRight className="size-3" />
            <strong className="font-semibold text-slate-600">Nueva institución</strong>
          </>
        }
        action={
          <Button variant="outline" disabled={s.busy} onClick={s.cancel}>
            <ArrowLeft />
            Cancelar
          </Button>
        }
      />
      <div className="grid items-start gap-5 md:grid-cols-[200px_minmax(0,1fr)] xl:grid-cols-[245px_minmax(0,1fr)]">
        <InstitutionWizardSteps step={s.step} onStep={s.goToStep} />
        <form
          onSubmit={s.onSubmit}
          className="border-divider min-w-0 rounded-[13px] border bg-white p-4 shadow-[0_2px_16px_rgba(20,43,89,0.035)] sm:px-[31px] sm:py-7"
        >
          <fieldset disabled={s.busy}>
            {s.step === 0 ? (
              <InstitutionBasicFields form={s.form} values={s.values} domain={domain} />
            ) : s.step === 1 ? (
              <>
                <h2 className="text-[17px] font-bold tracking-tight">Selecciona los módulos</h2>
                <p className="text-muted mt-2 mb-6 text-xs leading-5">
                  Elige las funcionalidades disponibles para este colegio. Las dependencias se
                  habilitan automáticamente.
                </p>
                <ModuleSelector
                  catalog={catalog}
                  selected={s.values.enabledModules ?? []}
                  onChange={s.setModules}
                />
                <p className="mt-5 flex gap-2.5 rounded-[9px] border border-blue-100 bg-blue-50/50 p-3.5 text-[11px] leading-5 text-blue-700">
                  <Info className="mt-0.5 size-4 shrink-0" />
                  Si activas Boletas, se habilitarán sus módulos necesarios. Desactivar dependencias
                  requiere confirmación y conserva los datos históricos.
                </p>
              </>
            ) : (
              <InstitutionWizardReview
                values={s.values}
                domain={domain}
                catalog={catalog}
                onEdit={s.goToStep}
              />
            )}
          </fieldset>
          <footer className="mt-5 flex items-center justify-between gap-3 border-t border-slate-100 pt-5">
            {s.step ? (
              <Button variant="outline" disabled={s.busy} onClick={s.previous}>
                <ArrowLeft />
                Anterior
              </Button>
            ) : (
              <span className="text-muted text-[11px]">Paso 1 de 3</span>
            )}
            <Button type="submit" size="lg" disabled={s.busy}>
              {s.step === 2 ? <Check /> : null}
              {s.busy ? "Procesando…" : s.step === 2 ? "Crear institución" : "Continuar"}
              {s.step < 2 ? <ArrowRight /> : null}
            </Button>
          </footer>
        </form>
      </div>
    </>
  );
}
