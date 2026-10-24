import type { UseFormReturn } from "react-hook-form";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { InstitutionProfileForm } from "./institution-profile-form";
import type {
  InstitutionSetup,
  InstitutionProfileValues,
} from "../schemas/institution-setup-schemas";
export function InstitutionInformation({
  profile,
  editing,
  form,
  busy,
  onEdit,
  onSave,
  onCancel,
  onStatus,
}: {
  profile: InstitutionSetup["profile"];
  editing: boolean;
  form: UseFormReturn<InstitutionProfileValues>;
  busy: boolean;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onStatus: () => void;
}) {
  return (
    <div className="space-y-5">
      {editing ? (
        <div>
          <InstitutionProfileForm form={form} onSubmit={onSave} busy={busy} />
          <Button className="mt-3" variant="ghost" disabled={busy} onClick={onCancel}>
            Cancelar edición
          </Button>
        </div>
      ) : (
        <section className="rounded-[11px] border border-[#e9edf4] p-5">
          <header className="mb-5 flex items-center justify-between gap-3">
            <h3 className="text-[13px] font-bold">Información institucional</h3>
            <Button size="sm" variant="outline" onClick={onEdit}>
              <Pencil />
              Editar
            </Button>
          </header>
          <dl className="grid gap-5 sm:grid-cols-2">
            {[
              ["Nombre oficial", profile.name],
              ["Identificador", profile.slug],
              ["Correo de contacto", profile.contactEmail],
              ["Persona de contacto", profile.contactName],
              ["Teléfono", profile.phone],
              ["Dirección", profile.address],
              ["Código del centro", profile.centerCode],
              ["Zona horaria", profile.timeZoneId],
            ].map(([key, value]) => (
              <div key={key}>
                <dt className="text-muted text-[11px]">{key}</dt>
                <dd className="mt-1.5 text-xs font-semibold break-words text-slate-700">
                  {value || "Sin especificar"}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      )}
      <section className="flex flex-wrap items-center justify-between gap-4 rounded-[11px] border border-red-100 p-5">
        <div>
          <h3 className="text-xs font-bold">Estado de la institución</h3>
          <p className="text-muted mt-2 text-[11px] leading-5">
            La suspensión restringe el acceso al colegio, sin eliminar información histórica.
          </p>
          <Badge className="mt-2" variant={profile.status === "Active" ? "success" : "destructive"}>
            {profile.status === "Active" ? "Activa" : "Suspendida"}
          </Badge>
        </div>
        <Button
          variant="outline"
          className={
            profile.status === "Active"
              ? "border-red-100 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700"
              : ""
          }
          onClick={onStatus}
        >
          {profile.status === "Active" ? "Suspender" : "Reactivar"}
        </Button>
      </section>
    </div>
  );
}
