"use client";

import Link from "next/link";
import { ProblemAlert } from "@/components/api/problem-alert";
import { SectionCard } from "@/components/shared/section-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAcceptStaffInvitation } from "../hooks/use-accept-staff-invitation";

export function AcceptStaffInvitationCard() {
  const { form, validLink, done, problem, submit } = useAcceptStaffInvitation();

  return (
    <SectionCard
      title={done ? "Su acceso está listo" : "Invitación al equipo del colegio"}
      description={
        done
          ? "Su cuenta ya tiene acceso al equipo de la institución."
          : "Complete sus datos para activar el acceso que le concedió el colegio."
      }
    >
      {done ? (
        <Link href="/" className="font-medium underline">
          Ir al portal del colegio para iniciar sesión
        </Link>
      ) : !validLink ? (
        <p className="text-sm">
          Abra el enlace completo recibido por correo. Si actualizó esta página, vuelva a abrir el
          enlace original.
        </p>
      ) : (
        <form onSubmit={submit} className="space-y-5">
          {problem ? <ProblemAlert problem={problem} /> : null}
          <div className="space-y-2">
            <Label htmlFor="displayName">Nombre completo</Label>
            <Input id="displayName" autoComplete="name" {...form.register("displayName")} />
            {form.formState.errors.displayName ? (
              <p className="text-sm text-red-700">{form.formState.errors.displayName.message}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              {...form.register("password")}
            />
            <p className="text-xs text-slate-500">
              Si ya tiene una cuenta, utilice su contraseña actual. Para una cuenta nueva, use al
              menos 12 caracteres con mayúsculas, minúsculas y números.
            </p>
            {form.formState.errors.password ? (
              <p className="text-sm text-red-700">{form.formState.errors.password.message}</p>
            ) : null}
          </div>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Activando…" : "Aceptar invitación"}
          </Button>
        </form>
      )}
    </SectionCard>
  );
}
