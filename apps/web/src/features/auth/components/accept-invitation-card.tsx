"use client";
import Link from "next/link";
import { SectionCard } from "@/components/shared/section-card";
import { ProblemAlert } from "@/components/api/problem-alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useAcceptInvitation } from "../hooks/use-accept-invitation";
export function AcceptInvitationCard() {
  const { form, validLink, done, problem, submit } = useAcceptInvitation();
  return (
    <SectionCard
      title={done ? "Su acceso está listo" : "Bienvenido a KNOROOMS"}
      description={
        done
          ? "La cuenta tiene acceso de administrador al colegio."
          : "Complete sus datos para aceptar la invitación."
      }
    >
      {done ? (
        <Link href="/" className="font-medium underline">
          Iniciar sesión en el colegio
        </Link>
      ) : !validLink ? (
        <p className="text-sm">
          Abra el enlace completo recibido por correo. Si actualizó esta página, vuelva a abrir el
          enlace.
        </p>
      ) : (
        <form onSubmit={submit} className="space-y-5">
          {problem && <ProblemAlert problem={problem} />}
          <div className="space-y-2">
            <Label htmlFor="displayName">Nombre completo</Label>
            <Input id="displayName" autoComplete="name" {...form.register("displayName")} />
            {form.formState.errors.displayName && (
              <p className="text-sm text-red-700">{form.formState.errors.displayName.message}</p>
            )}
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
              Si ya tiene cuenta, utilice su contraseña actual. Para una cuenta nueva, use al menos
              12 caracteres con mayúsculas, minúsculas y números.
            </p>
            {form.formState.errors.password && (
              <p className="text-sm text-red-700">{form.formState.errors.password.message}</p>
            )}
          </div>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Activando…" : "Aceptar y activar acceso"}
          </Button>
        </form>
      )}
    </SectionCard>
  );
}
