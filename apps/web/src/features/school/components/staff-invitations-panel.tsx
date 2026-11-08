"use client";

import { useState, type FormEvent } from "react";
import { MailPlus, RefreshCw, RotateCw, ShieldCheck, UserRoundX } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FeedbackBanner } from "@/components/shared/feedback-banner";
import { SectionCard } from "@/components/shared/section-card";
import { useStaffInvitations } from "@/features/school/hooks/use-staff-invitations";
import type { InstitutionStaffInvitationDto, ProblemDetails, RoleDto } from "@/lib/api/types";

interface StaffInvitationsPanelProps {
  initialInvitations: InstitutionStaffInvitationDto[];
  roles: RoleDto[];
  csrfToken: string;
  initialProblem: ProblemDetails | null;
}

function getInvitationStatus(item: InstitutionStaffInvitationDto) {
  if (item.acceptedAtUtc) return { label: "Aceptada", variant: "success" as const };
  if (item.revokedAtUtc) return { label: "Revocada", variant: "destructive" as const };
  if (new Date(item.expiresAtUtc) <= new Date()) {
    return { label: "Expirada", variant: "warning" as const };
  }

  if (item.deliveryStatus === "Failed") {
    return { label: "Error de envío", variant: "destructive" as const };
  }
  if (item.deliveryStatus === "Sent") {
    return { label: "Enviada", variant: "success" as const };
  }
  return { label: "Pendiente", variant: "default" as const };
}

export function StaffInvitationsPanel({
  initialInvitations,
  roles,
  csrfToken,
  initialProblem,
}: StaffInvitationsPanelProps) {
  const state = useStaffInvitations(initialInvitations, initialProblem, csrfToken);
  const [email, setEmail] = useState("");
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [showAll, setShowAll] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const created = await state.create(email, selectedRoles);
    if (created) {
      setEmail("");
      setSelectedRoles([]);
    }
  }

  const visibleInvitations = showAll ? state.invitations : state.invitations.slice(0, 8);

  return (
    <div className="space-y-5">
      <FeedbackBanner successMessage={null} problem={state.problem} />

      <SectionCard
        icon={<MailPlus className="size-5 text-slate-800" />}
        title="Invitar personal"
        description="Envía una invitación segura y asigna los roles que tendrá la persona en este colegio."
      >
        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          <label className="block space-y-2 text-xs font-semibold text-slate-700">
            Correo electrónico
            <Input
              type="email"
              autoComplete="email"
              required
              maxLength={254}
              placeholder="persona@colegio.edu.do"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>

          <fieldset className="space-y-3">
            <legend className="text-xs font-semibold text-slate-700">Roles que se asignarán</legend>
            {roles.length ? (
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {roles.map((role) => (
                  <label
                    key={role.id}
                    className="flex cursor-pointer items-start gap-2 rounded-lg border border-slate-200 p-3 text-xs hover:border-blue-300"
                  >
                    <input
                      type="checkbox"
                      className="mt-0.5 accent-blue-600"
                      checked={selectedRoles.includes(role.id)}
                      onChange={(event) =>
                        setSelectedRoles((current) =>
                          event.target.checked
                            ? [...current, role.id]
                            : current.filter((id) => id !== role.id),
                        )
                      }
                    />
                    <span>
                      <span className="block font-semibold text-slate-900">{role.name}</span>
                      <span className="mt-1 block text-slate-500">
                        {role.permissions.length} permisos
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            ) : (
              <p className="text-xs text-amber-700">No hay roles disponibles que puedas asignar.</p>
            )}
          </fieldset>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
            <p className="text-[11px] text-slate-500">
              La invitación vence en 48 horas y solo puede utilizarse una vez.
            </p>
            <Button
              type="submit"
              disabled={state.creating || !roles.length || !selectedRoles.length}
            >
              <MailPlus />
              {state.creating ? "Enviando…" : "Enviar invitación"}
            </Button>
          </div>
        </form>
      </SectionCard>

      <SectionCard
        icon={<ShieldCheck className="size-5 text-slate-800" />}
        title="Invitaciones del colegio"
        description="Consulta el estado y administra las invitaciones pendientes."
        headerAction={
          <Button variant="outline" size="sm" disabled={state.refreshing} onClick={state.refresh}>
            <RefreshCw className={state.refreshing ? "animate-spin" : ""} />
            Actualizar
          </Button>
        }
      >
        {visibleInvitations.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 text-[10px] tracking-wide text-slate-500 uppercase">
                <tr>
                  <th className="px-5 py-3">Correo</th>
                  <th className="px-4 py-3">Roles</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">Vence</th>
                  <th className="px-5 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {visibleInvitations.map((item) => {
                  const status = getInvitationStatus(item);
                  const active =
                    !item.acceptedAtUtc &&
                    !item.revokedAtUtc &&
                    new Date(item.expiresAtUtc) > new Date();
                  const busy = state.busyId === item.id;

                  return (
                    <tr key={item.id} className="border-b border-slate-100 last:border-0">
                      <td className="px-5 py-4 font-medium text-slate-900">{item.email}</td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-1">
                          {item.roleIds.map((id) => (
                            <Badge key={id} variant="secondary">
                              {roles.find((role) => role.id === id)?.name ?? "Rol"}
                            </Badge>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-slate-600">
                        {new Date(item.expiresAtUtc).toLocaleString("es-DO", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          {active ? (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={busy}
                                onClick={() => state.resend(item)}
                              >
                                <RotateCw />
                                Reenviar
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                disabled={busy}
                                onClick={() => state.revoke(item)}
                              >
                                <UserRoundX />
                                Revocar
                              </Button>
                            </>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="p-8 text-center text-xs text-slate-500">
            Todavía no hay invitaciones registradas.
          </p>
        )}

        {state.invitations.length > 8 ? (
          <div className="border-t border-slate-100 p-3 text-center">
            <Button size="sm" variant="ghost" onClick={() => setShowAll((value) => !value)}>
              {showAll ? "Mostrar menos" : `Ver todas (${state.invitations.length})`}
            </Button>
          </div>
        ) : null}
      </SectionCard>
    </div>
  );
}
