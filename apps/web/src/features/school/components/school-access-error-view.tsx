import { AlertOctagon, Ban, Building2, KeyRound, Lock, ShieldAlert } from "lucide-react";
import { isMfaRequiredProblem, ProblemAlert } from "@/components/api/problem-alert";
import { LogoutButton } from "@/components/auth/logout-button";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { ProblemDetails } from "@/lib/api/types";

interface SchoolAccessErrorViewProps {
  status: number;
  problem: ProblemDetails;
  rawHost: string;
  slug: string;
  userEmail: string;
  csrfToken: string;
  returnTo: string;
}

export function SchoolAccessErrorView({
  status,
  problem,
  rawHost,
  slug,
  userEmail,
  csrfToken,
  returnTo,
}: SchoolAccessErrorViewProps) {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-slate-900 text-white">
              <Building2 className="size-5" />
            </div>
            <div>
              <span className="font-bold text-slate-900">KNOROOMS</span>
              <Badge variant="outline" className="ml-2 font-mono text-xs">
                {rawHost}
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-600">{userEmail}</span>
            <LogoutButton csrfToken={csrfToken} />
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-2xl flex-1 items-center justify-center px-6 py-12">
        {status === 404 ? (
          <Card className="w-full border-slate-300">
            <CardHeader>
              <div className="flex items-center gap-2 text-slate-800">
                <AlertOctagon className="size-5 text-slate-700" />
                <CardTitle>Colegio No Encontrado (404)</CardTitle>
              </div>
              <CardDescription>
                No existe ninguna institución educativa registrada bajo el subdominio{" "}
                <code className="font-mono font-semibold text-slate-900">{slug}</code>.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-slate-600">
              {problem.detail ??
                "Verifique la dirección institucional o contacte a la administración de KNOROOMS."}
            </CardContent>
          </Card>
        ) : status === 423 ? (
          <Card className="w-full border-amber-300 bg-amber-50/30">
            <CardHeader>
              <div className="flex items-center gap-2 text-amber-900">
                <Lock className="size-5 text-amber-700" />
                <CardTitle>Institución Suspendida Temporalmente (423)</CardTitle>
              </div>
              <CardDescription className="text-amber-800">
                El portal del colegio <code className="font-mono font-semibold">{slug}</code> se
                encuentra suspendido.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-amber-900">
              <p>
                {problem.detail ??
                  "Las operaciones académicas y administrativas de esta institución han sido suspendidas temporalmente por la administración global."}
              </p>
              {problem.traceId ? (
                <p className="font-mono text-xs text-amber-700">Trace ID: {problem.traceId}</p>
              ) : null}
            </CardContent>
          </Card>
        ) : status === 403 && isMfaRequiredProblem(problem) ? (
          <Card className="w-full border-amber-300">
            <CardHeader>
              <div className="flex items-center gap-2 text-amber-900">
                <ShieldAlert className="size-5 text-amber-700" />
                <CardTitle>Autenticación Multifactor (MFA) Requerida (403)</CardTitle>
              </div>
              <CardDescription>
                Esta institución exige verificación de segundo factor (MFA) activa en su sesión.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-slate-600">
              <p>
                {problem.detail ??
                  "Por políticas de seguridad institucional, debe iniciar sesión completando el segundo factor de autenticación."}
              </p>
            </CardContent>
            <CardFooter>
              <ButtonLink href={returnTo}>
                <KeyRound className="size-4" />
                Volver a iniciar sesión
              </ButtonLink>
            </CardFooter>
          </Card>
        ) : status === 403 ? (
          <Card className="w-full border-red-200">
            <CardHeader>
              <div className="flex items-center gap-2 text-red-800">
                <Ban className="size-5 text-red-600" />
                <CardTitle>Sin Membresía Activa en este Colegio (403)</CardTitle>
              </div>
              <CardDescription>
                Su usuario (<span className="font-medium">{userEmail}</span>) no posee una membresía
                activa ni un permiso temporal de soporte vigente en{" "}
                <code className="font-mono font-semibold">{slug}</code>.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-slate-600">
              <p>
                {problem.detail ??
                  "El subdominio identifica a la institución, pero el acceso exige una membresía institucional activa o una concesión de soporte previamente aprobada por el colegio."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="w-full">
            <ProblemAlert problem={problem} />
          </div>
        )}
      </main>
    </div>
  );
}
