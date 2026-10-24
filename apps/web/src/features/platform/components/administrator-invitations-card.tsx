import type { UseFormReturn } from "react-hook-form";
import { SectionCard } from "@/components/shared/section-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  invitationStatusLabels,
  type InstitutionSetup,
} from "../schemas/institution-setup-schemas";
export function AdministratorInvitationsCard({
  data,
  form,
  busy,
  onInvite,
  onRevoke,
}: {
  data: InstitutionSetup;
  form: UseFormReturn<{ email: string }>;
  busy: boolean;
  onInvite: () => void;
  onRevoke: (id: string) => void;
}) {
  return (
    <SectionCard
      title="Administradores e invitaciones"
      description="La invitación llega por correo, vence en 48 horas y solo puede utilizarse una vez."
    >
      <div className="space-y-5">
        {data.administrators.length ? (
          <ul className="space-y-2">
            {data.administrators.map((x) => (
              <li key={x.userId} className="rounded-md bg-emerald-50 p-3 text-sm">
                <strong>{x.displayName}</strong>
                <span className="block">{x.email} · Administrador activo</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-500">Todavía no hay un administrador activo.</p>
        )}
        <form onSubmit={onInvite} className="space-y-2">
          <Label htmlFor="invitationEmail">Correo del administrador</Label>
          <div className="flex flex-wrap gap-2">
            <Input
              id="invitationEmail"
              type="email"
              className="min-w-60 flex-1"
              disabled={busy}
              {...form.register("email")}
            />
            <Button disabled={busy || data.profile.status !== "Active"} type="submit">
              Enviar invitación
            </Button>
          </div>
          {form.formState.errors.email && (
            <p className="text-sm text-red-700">{form.formState.errors.email.message}</p>
          )}
        </form>
        <ul className="divide-y">
          {data.invitations.map((x) => (
            <li
              key={x.id}
              className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm"
            >
              <div>
                <p className="font-medium">{x.email}</p>
                <p className="text-slate-500">
                  {invitationStatusLabels[x.status]} · {invitationStatusLabels[x.deliveryStatus]} ·
                  Vence {new Date(x.expiresAt).toLocaleString("es-DO")}
                </p>
              </div>
              {x.status === "Pending" && (
                <Button variant="outline" disabled={busy} onClick={() => onRevoke(x.id)}>
                  Revocar
                </Button>
              )}
            </li>
          ))}
        </ul>
        <p className="text-xs text-slate-500">
          Si el envío falla o la invitación vence, revise el correo configurado, revoque la anterior
          si sigue pendiente y envíe una nueva.
        </p>
      </div>
    </SectionCard>
  );
}
