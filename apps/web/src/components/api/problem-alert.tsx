import { AlertTriangle, Ban, Lock, ShieldAlert } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { ProblemDetails } from "@/lib/api/types";

interface ProblemAlertProps {
  problem: ProblemDetails;
}

export function isMfaRequiredProblem(problem: ProblemDetails): boolean {
  return Boolean(problem.type && problem.type.toLowerCase().endsWith("/mfa-required"));
}

export function ProblemAlert({ problem }: ProblemAlertProps) {
  const mfaRequired = problem.status === 403 && isMfaRequiredProblem(problem);

  if (mfaRequired) {
    return (
      <Alert variant="warning">
        <ShieldAlert className="size-4" />
        <AlertTitle>Autenticación Multifactor (MFA) Requerida (403)</AlertTitle>
        <AlertDescription className="space-y-1">
          <p>
            {problem.detail ??
              "Esta operación o contexto institucional exige que su cuenta haya completado verificación multifactor (MFA)."}
          </p>
          {problem.traceId ? (
            <p className="font-mono text-xs text-amber-800">Trace ID: {problem.traceId}</p>
          ) : null}
        </AlertDescription>
      </Alert>
    );
  }

  if (problem.status === 423) {
    return (
      <Alert variant="warning">
        <Lock className="size-4" />
        <AlertTitle>Institución Suspendida (423)</AlertTitle>
        <AlertDescription className="space-y-1">
          <p>
            {problem.detail ??
              "El acceso operativo a esta institución educativa se encuentra temporalmente suspendido por la administración de la plataforma."}
          </p>
          {problem.traceId ? (
            <p className="font-mono text-xs text-amber-800">Trace ID: {problem.traceId}</p>
          ) : null}
        </AlertDescription>
      </Alert>
    );
  }

  if (problem.status === 403) {
    return (
      <Alert variant="destructive">
        <Ban className="size-4" />
        <AlertTitle>Acceso Denegado — Sin Permisos o Membresía Activa (403)</AlertTitle>
        <AlertDescription className="space-y-1">
          <p>
            {problem.detail ??
              "Su cuenta está autenticada, pero no posee una membresía activa ni los permisos requeridos en este ámbito."}
          </p>
          {problem.traceId ? (
            <p className="font-mono text-xs text-red-800">Trace ID: {problem.traceId}</p>
          ) : null}
        </AlertDescription>
      </Alert>
    );
  }

  const fieldErrors = problem.errors ? Object.entries(problem.errors) : [];

  return (
    <Alert variant="destructive">
      <AlertTriangle className="size-4" />
      <AlertTitle>
        {problem.title} (HTTP {problem.status})
      </AlertTitle>
      <AlertDescription className="space-y-2">
        {problem.detail ? <p>{problem.detail}</p> : null}
        {fieldErrors.length > 0 ? (
          <ul className="list-disc space-y-1 pl-5 text-xs">
            {fieldErrors.map(([field, messages]) => (
              <li key={field}>
                <span className="font-semibold">{field}:</span> {messages.join(", ")}
              </li>
            ))}
          </ul>
        ) : null}
        {problem.traceId ? (
          <p className="font-mono text-xs text-red-800">Trace ID: {problem.traceId}</p>
        ) : null}
      </AlertDescription>
    </Alert>
  );
}
