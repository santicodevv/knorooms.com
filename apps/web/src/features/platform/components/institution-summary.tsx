"use client";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionCard } from "@/components/shared/section-card";
import type { InstitutionSetup } from "../schemas/institution-setup-schemas";
import type { ModuleSettings, ProductModule } from "../schemas/institution-management-schemas";
export function InstitutionSummary({
  data,
  modules,
  catalog,
  portalUrl,
  onTab,
  onInvite,
}: {
  data: InstitutionSetup;
  modules: ModuleSettings;
  catalog: ProductModule[];
  portalUrl: string;
  onTab: (tab: string) => void;
  onInvite: () => void;
}) {
  const p = data.profile;
  const admin = data.administrators[0];
  const invitations = data.invitations;
  return (
    <>
      <div className="grid gap-5 md:grid-cols-2">
        <SectionCard title="Información general">
          <dl className="grid gap-5 text-xs sm:grid-cols-2">
            {[
              ["Nombre oficial", p.name],
              ["Subdominio", new URL(portalUrl).host],
              ["Correo de contacto", p.contactEmail || "Sin especificar"],
              ["Zona horaria", p.timeZoneId],
            ].map(([key, value]) => (
              <div key={key}>
                <dt className="text-muted text-[11px]">{key}</dt>
                <dd className="mt-1 font-medium break-all">{value}</dd>
              </div>
            ))}
          </dl>
        </SectionCard>
        <SectionCard
          title="Módulos habilitados"
          headerAction={
            <Button size="sm" variant="outline" onClick={() => onTab("modules")}>
              Administrar módulos
            </Button>
          }
        >
          <ul className="space-y-3 text-xs">
            {catalog.map((mod) => (
              <li key={mod.code} className="flex items-center justify-between gap-3">
                <span>{mod.name}</span>
                <span
                  className={`rounded px-2 py-1 text-[11px] ${!mod.available ? "bg-slate-100 text-slate-500" : modules.enabledModules.includes(mod.code) ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}
                >
                  {!mod.available
                    ? "Próximamente"
                    : modules.enabledModules.includes(mod.code)
                      ? "Activo"
                      : "Desactivado"}
                </span>
              </li>
            ))}
          </ul>
        </SectionCard>
      </div>
      <SectionCard
        className="mt-4 rounded-[10px] shadow-none"
        title="Administrador inicial"
        headerAction={
          <Button variant="outline" size="sm" onClick={() => onInvite()}>
            <UserPlus />
            {admin ? "Gestionar administrador" : "Invitar administrador"}
          </Button>
        }
      >
        {admin ? (
          <div className="text-sm">
            <p className="mb-2 text-xs font-medium text-emerald-700">Administrador activo</p>
            <p className="font-medium">{admin.displayName}</p>
            <p className="mt-1 text-slate-500">{admin.email}</p>
          </div>
        ) : (
          <p className="text-muted text-xs leading-5">
            {invitations.some((inv) => inv.status === "Pending")
              ? "Hay una invitación pendiente de activación. Consulte su estado y vencimiento."
              : "Todavía no hay un administrador activo para este colegio."}
          </p>
        )}
      </SectionCard>
    </>
  );
}
