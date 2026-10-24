import { Info, UserRound, UserPlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { InstitutionSetup } from "../schemas/institution-setup-schemas";
export function InstitutionAdministrator({
  data,
  onManage,
}: {
  data: InstitutionSetup;
  onManage: () => void;
}) {
  const admin = data.administrators[0];
  return (
    <div>
      <section className="rounded-[11px] border border-[#e9edf4] p-5">
        <header className="mb-5 flex items-center justify-between gap-3">
          <h3 className="text-[13px] font-bold">Administrador inicial</h3>
          <Badge variant={admin ? "success" : "warning"}>
            {admin ? "Administrador activo" : "Sin administrador activo"}
          </Badge>
        </header>
        <div className="flex items-center gap-3.5">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <UserRound className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-semibold break-all">
              {admin?.email ?? "Sin administrador activo"}
            </p>
            <p className="text-muted mt-2 text-[11px] leading-5">
              {admin
                ? `${admin.displayName} tiene acceso al portal institucional.`
                : "Invita a la persona responsable o revisa el estado de sus invitaciones."}
            </p>
          </div>
        </div>
        <Button className="mt-5" onClick={onManage}>
          <UserPlus />
          {admin ? "Gestionar administrador e invitaciones" : "Invitar o gestionar invitaciones"}
        </Button>
      </section>
      <div className="mt-4 flex gap-2.5 rounded-[9px] border border-blue-100 bg-blue-50/50 p-3.5 text-[11px] leading-5 text-blue-700">
        <Info className="mt-0.5 size-4 shrink-0" />
        El invitado define su contraseña en un enlace seguro. Si ya tiene una cuenta, confirma su
        vinculación con su contraseña actual.
      </div>
    </div>
  );
}
