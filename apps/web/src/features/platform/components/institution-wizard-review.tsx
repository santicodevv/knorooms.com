import { Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { ProductModule, ProvisionValues } from "../schemas/institution-management-schemas";
export function InstitutionWizardReview({
  values,
  domain,
  catalog,
  onEdit,
}: {
  values: ProvisionValues;
  domain: string;
  catalog: ProductModule[];
  onEdit: (step: number) => void;
}) {
  return (
    <>
      <h2 className="text-[17px] font-bold tracking-tight">Revisa antes de crear</h2>
      <p className="text-muted mt-2 mb-6 text-xs leading-5">
        Comprueba la información y los módulos. El colegio se registrará al confirmar.
      </p>
      <section className="border-divider mb-3 rounded-[11px] border p-4">
        <header className="mb-4 flex items-center justify-between">
          <h3 className="text-xs font-bold">Información general</h3>
          <button
            type="button"
            onClick={() => onEdit(0)}
            className="text-[11px] font-semibold text-blue-600"
          >
            Editar
          </button>
        </header>
        <dl className="grid gap-4 sm:grid-cols-2">
          {[
            ["Nombre oficial", values.name],
            ["Subdominio", `${values.slug}.${domain}`],
            ["Correo de contacto", values.contactEmail],
            ["Teléfono", values.phone || "No especificado"],
            ["Dirección", values.address || "No especificada"],
          ].map(([key, value]) => (
            <div key={key}>
              <dt className="text-muted text-[11px]">{key}</dt>
              <dd className="mt-1.5 text-xs font-semibold break-words text-slate-700">{value}</dd>
            </div>
          ))}
        </dl>
      </section>
      <section className="border-divider rounded-[11px] border p-4">
        <header className="mb-4 flex items-center justify-between">
          <h3 className="text-xs font-bold">
            Módulos seleccionados ({values.enabledModules.length})
          </h3>
          <button
            type="button"
            onClick={() => onEdit(1)}
            className="text-[11px] font-semibold text-blue-600"
          >
            Editar
          </button>
        </header>
        <div className="flex flex-wrap gap-2">
          {values.enabledModules.length ? (
            values.enabledModules.map((code) => (
              <Badge key={code}>{catalog.find((mod) => mod.code === code)?.name}</Badge>
            ))
          ) : (
            <p className="text-muted text-xs">
              Sin módulos seleccionados. Podrás configurarlos después.
            </p>
          )}
        </div>
      </section>
      <p className="mt-4 flex gap-2.5 rounded-[9px] border border-blue-100 bg-blue-50/50 p-3.5 text-[11px] leading-5 text-blue-700">
        <Info className="mt-0.5 size-4 shrink-0" />
        Después de crear, podrás invitar al administrador desde la ficha o la fila del colegio. No
        tendrás que establecer su contraseña.
      </p>
    </>
  );
}
