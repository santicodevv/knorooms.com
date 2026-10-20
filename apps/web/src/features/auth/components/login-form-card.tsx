"use client";

import { KeyRound, ShieldCheck } from "lucide-react";
import { ProblemAlert } from "@/components/api/problem-alert";
import { FormFieldError } from "@/components/shared/form-field-error";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
    <div className="mx-auto flex min-h-[70vh] max-w-lg items-center justify-center px-4 py-12">
      <Card className="w-full border-slate-200 shadow-sm">
        <CardHeader className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-slate-500 uppercase">
            <ShieldCheck className="size-4 text-slate-700" />
            <span>Acceso seguro</span>
          </div>
          <CardTitle className="text-xl text-slate-900">{title}</CardTitle>
          <CardDescription className="text-slate-600">{description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {hostLabel ? (
            <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
              Contexto de host actual:{" "}
              <span className="font-mono font-semibold text-slate-900">{hostLabel}</span>
            </div>
          ) : null}

          {problem ? <ProblemAlert problem={problem} /> : null}

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div className="space-y-1.5">
              <Label htmlFor="login-email">Correo electrónico</Label>
              <Input
                id="login-email"
                type="email"
                autoComplete="username"
                placeholder="usuario@colegio.edu.do"
                {...form.register("email")}
              />
              <FormFieldError message={form.formState.errors.email?.message} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="login-password">Contraseña</Label>
              <Input
                id="login-password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                {...form.register("password")}
              />
              <FormFieldError message={form.formState.errors.password?.message} />
            </div>

            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
              <KeyRound className="size-4" />
              {form.formState.isSubmitting ? "Iniciando sesión..." : "Iniciar sesión"}
            </Button>
          </form>
        </CardContent>
        <CardFooter>
          <p className="text-xs leading-relaxed text-slate-500">
            Su sesión se gestiona de forma segura en el servidor mediante cookies{" "}
            <code className="font-mono text-slate-700">HttpOnly</code> exclusivas de este
            subdominio. Ningún token se expone al navegador.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
