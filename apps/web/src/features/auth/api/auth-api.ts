import type { ProblemDetails } from "@/lib/api/types";

export interface LoginSuccessResponse {
  authenticated: true;
  returnTo: string;
}

export type LoginResult =
  { ok: true; data: LoginSuccessResponse } | { ok: false; problem: ProblemDetails };

/**
 * Envía las credenciales al endpoint del BFF, que a su vez autentica contra el
 * backend propio. Nunca se expone ningún token al navegador: la sesión se
 * guarda del lado del servidor en una cookie HttpOnly.
 */
export async function submitLogin(payload: {
  email: string;
  password: string;
  returnTo: string;
}): Promise<LoginResult> {
  let response: Response;
  try {
    response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json, application/problem+json",
      },
      body: JSON.stringify(payload),
      credentials: "same-origin",
    });
  } catch {
    return {
      ok: false,
      problem: {
        title: "Servicio no disponible",
        status: 502,
        detail: "No fue posible contactar con el servicio de autenticación.",
      },
    };
  }

  if (response.ok) {
    const data = (await response.json()) as LoginSuccessResponse;
    return { ok: true, data };
  }

  let problem: ProblemDetails = {
    title: "No fue posible iniciar sesión",
    status: response.status,
  };

  try {
    const parsed = (await response.json()) as Partial<ProblemDetails>;
    problem = {
      type: parsed.type,
      title: parsed.title ?? problem.title,
      status: parsed.status ?? response.status,
      detail: parsed.detail,
      traceId: parsed.traceId,
      errors: parsed.errors,
    };
  } catch {
    // Body wasn't JSON; keep the default problem.
  }

  return { ok: false, problem };
}
