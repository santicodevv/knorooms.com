import { LOGIN_REQUEST_TIMEOUT_MS } from "@/lib/auth/auth-timeouts";
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
  try {
    const response = await fetchLogin(payload);
    return await parseLoginResponse(response);
  } catch {
    return {
      ok: false,
      problem: {
        title: "No fue posible completar el acceso",
        status: 503,
        detail:
          "La solicitud tardó demasiado o el servicio no respondió correctamente. Inténtelo nuevamente.",
      },
    };
  }
}

async function fetchLogin(payload: {
  email: string;
  password: string;
  returnTo: string;
}): Promise<Response> {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json, application/problem+json",
    },
    body: JSON.stringify(payload),
    credentials: "same-origin",
    signal: AbortSignal.timeout(LOGIN_REQUEST_TIMEOUT_MS),
  });
  return response;
}

async function parseLoginResponse(response: Response): Promise<LoginResult> {
  if (response.ok) {
    const data = (await response.json()) as LoginSuccessResponse;
    if (data.authenticated !== true || typeof data.returnTo !== "string") {
      throw new Error("Invalid login response");
    }
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
