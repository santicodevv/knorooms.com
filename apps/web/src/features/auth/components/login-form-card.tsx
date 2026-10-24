"use client";
import {
  ArrowRight,
  Building2,
  GraduationCap,
  Layers3,
  LoaderCircle,
  ShieldCheck,
} from "lucide-react";
import { ProblemAlert } from "@/components/api/problem-alert";
import { FormFieldError } from "@/components/shared/form-field-error";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLoginForm } from "@/features/auth/hooks/use-login-form";
interface LoginFormCardProps {
  title: string;
  description: string;
  returnTo?: string;
  hostLabel?: string;
}
export function LoginFormCard({
  title,
  description,
  returnTo = "/",
  hostLabel,
}: LoginFormCardProps) {
  const { form, problem, onSubmit } = useLoginForm({ returnTo });
  return (
    <main className="grid min-h-dvh bg-white lg:grid-cols-[1fr_1.1fr]">
      <section className="relative hidden flex-col justify-between overflow-hidden bg-slate-950 p-12 text-white lg:flex xl:p-16">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-40 -right-48 size-[600px] rounded-full bg-blue-600/20 blur-3xl"
        />
        <div className="relative flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-xl bg-blue-600">
            <GraduationCap className="size-6" />
          </span>
          <span className="text-xl font-bold tracking-tight">KNOROOMS</span>
        </div>
        <div className="relative max-w-lg py-16">
          <p className="mb-5 text-xs font-semibold tracking-[0.2em] text-blue-300 uppercase">
            Una plataforma. Cada colegio.
          </p>
          <h1 className="text-4xl leading-tight font-semibold tracking-tight xl:text-5xl">
            Más claridad para gestionar la educación.
          </h1>
          <p className="mt-6 text-base leading-7 text-slate-300">
            Conecta instituciones, personas y herramientas en un espacio pensado para tu comunidad
            educativa.
          </p>
          <div className="mt-10 space-y-5">
            {[
              [Building2, "Cada institución, su propio espacio"],
              [Layers3, "Módulos que se adaptan a cada colegio"],
              [ShieldCheck, "Accesos seguros para tu equipo"],
            ].map(([Icon, label]) => {
              const FeatureIcon = Icon as typeof Building2;
              return (
                <div key={String(label)} className="flex items-center gap-3 text-sm text-slate-200">
                  <span className="rounded-lg border border-white/10 bg-white/5 p-2">
                    <FeatureIcon className="size-4 text-blue-300" />
                  </span>
                  {String(label)}
                </div>
              );
            })}
          </div>
        </div>
        <p className="relative text-xs text-slate-400">Gestión educativa · República Dominicana</p>
      </section>
      <section className="flex flex-col justify-center px-6 py-12 sm:px-12">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-12 flex items-center gap-2 text-lg font-bold text-slate-950 lg:hidden">
            <GraduationCap className="size-7 text-blue-600" /> KNOROOMS
          </div>
          <span className="mb-6 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700">
            <ShieldCheck className="size-3.5" />
            Acceso seguro
          </span>
          <h2 className="text-3xl font-bold tracking-tight text-slate-950">Bienvenido de nuevo</h2>
          <p className="mt-3 text-sm font-semibold text-slate-700">{title}</p>
          <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
          {hostLabel ? <p className="text-muted mt-4 text-xs break-all">{hostLabel}</p> : null}
          <div className="mt-8">{problem ? <ProblemAlert problem={problem} /> : null}</div>
          <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-5" noValidate>
            <div className="space-y-2">
              <Label htmlFor="login-email">Correo electrónico</Label>
              <Input
                id="login-email"
                type="email"
                autoComplete="username"
                placeholder="usuario@colegio.edu.do"
                aria-invalid={Boolean(form.formState.errors.email)}
                {...form.register("email")}
              />
              <FormFieldError message={form.formState.errors.email?.message} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="login-password">Contraseña</Label>
              <Input
                id="login-password"
                type="password"
                autoComplete="current-password"
                placeholder="Escribe tu contraseña"
                aria-invalid={Boolean(form.formState.errors.password)}
                {...form.register("password")}
              />
              <FormFieldError message={form.formState.errors.password?.message} />
            </div>
            <Button
              type="submit"
              size="lg"
              className="mt-2 w-full"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? <LoaderCircle className="animate-spin" /> : null}
              {form.formState.isSubmitting ? "Iniciando sesión…" : "Iniciar sesión"}
              {!form.formState.isSubmitting ? <ArrowRight /> : null}
            </Button>
          </form>
          <p className="text-muted mt-8 border-t border-slate-100 pt-6 text-center text-xs leading-5">
            Tu acceso está vinculado a la institución y los permisos de tu cuenta.
          </p>
        </div>
      </section>
    </main>
  );
}
