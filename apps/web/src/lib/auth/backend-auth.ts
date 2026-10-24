import "server-only";
import { AUTH_API_TIMEOUT_MS } from "@/lib/auth/auth-timeouts";

export interface IssuedTokens {
  accessToken: string;
  accessTokenExpiresAtUtc: string;
  refreshToken: string;
  refreshTokenExpiresAtUtc: string;
  userId: string;
  email: string;
  displayName: string;
  isPlatformAdmin: boolean;
  isPlatformSupport: boolean;
}

export interface SessionUser {
  sub: string;
  name: string;
  email: string;
}

export interface AuthProblem {
  title: string;
  status: number;
  detail?: string;
}

function getApiBaseUrl(): string {
  return (process.env.API_BASE_URL ?? "http://localhost:5080").trim().replace(/\/$/, "");
}

function toSessionUser(tokens: IssuedTokens): SessionUser {
  return {
    sub: tokens.userId,
    name: tokens.displayName,
    email: tokens.email,
  };
}

export { toSessionUser };

async function parseProblem(response: Response): Promise<AuthProblem> {
  let title = "Error de autenticación";
  let detail: string | undefined;
  try {
    const parsed = (await response.json()) as { title?: string; detail?: string };
    title = parsed.title ?? title;
    detail = parsed.detail;
  } catch {
    // Body wasn't JSON.
  }
  return { title, status: response.status, detail };
}

/**
 * Autentica contra el backend propio de KNOROOMS con usuario y contraseña.
 * Devuelve los tokens emitidos por el backend (JWT de acceso + refresh opaco).
 */
export async function loginWithPassword(params: {
  email: string;
  password: string;
  forwardedHost: string;
  forwardedProto: string;
}): Promise<{ ok: true; tokens: IssuedTokens } | { ok: false; problem: AuthProblem }> {
  let response: Response;
  try {
    response = await fetch(`${getApiBaseUrl()}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json, application/problem+json",
        "X-Forwarded-Host": params.forwardedHost,
        "X-Forwarded-Proto": params.forwardedProto,
      },
      body: JSON.stringify({ email: params.email, password: params.password }),
      cache: "no-store",
      signal: AbortSignal.timeout(AUTH_API_TIMEOUT_MS),
    });
  } catch {
    return {
      ok: false,
      problem: {
        title: "API interna no disponible",
        status: 502,
        detail: "No fue posible conectar con el servidor de autenticación.",
      },
    };
  }

  if (!response.ok) {
    return { ok: false, problem: await parseProblem(response) };
  }

  const tokens = (await response.json()) as IssuedTokens;
  return { ok: true, tokens };
}

/**
 * Intercambia un refresh token por un nuevo par de tokens (rotación obligatoria).
 */
export async function refreshBackendTokens(refreshToken: string): Promise<IssuedTokens | null> {
  try {
    const response = await fetch(`${getApiBaseUrl()}/api/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json, application/problem+json",
      },
      body: JSON.stringify({ refreshToken }),
      cache: "no-store",
      signal: AbortSignal.timeout(AUTH_API_TIMEOUT_MS),
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as IssuedTokens;
  } catch {
    return null;
  }
}

/**
 * Revoca un refresh token en el backend (best-effort en el cierre de sesión).
 */
export async function revokeBackendRefreshToken(refreshToken: string): Promise<void> {
  try {
    await fetch(`${getApiBaseUrl()}/api/auth/logout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json, application/problem+json",
      },
      body: JSON.stringify({ refreshToken }),
      cache: "no-store",
      signal: AbortSignal.timeout(AUTH_API_TIMEOUT_MS),
    });
  } catch {
    // Best-effort: la sesión local se revoca siempre.
  }
}
