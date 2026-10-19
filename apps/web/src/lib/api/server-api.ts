import "server-only";
import { headers } from "next/headers";
import type { ApiResult, ProblemDetails } from "@/lib/api/types";
import { getServerSession } from "@/lib/auth/session-store";

function getApiBaseUrl(): string {
  return (process.env.API_BASE_URL ?? "http://localhost:5080").trim().replace(/\/$/, "");
}

export async function serverApiFetch<T>(
  apiPath: string,
  init?: Omit<RequestInit, "headers"> & { headers?: Record<string, string> },
): Promise<ApiResult<T>> {
  const session = await getServerSession();
  if (!session) {
    return {
      ok: false,
      status: 401,
      problem: {
        title: "No autenticado",
        status: 401,
        detail: "No existe una sesión autenticada activa.",
      },
    };
  }

  const incomingHeaders = await headers();
  const forwardedHost =
    incomingHeaders.get("x-forwarded-host") ?? incomingHeaders.get("host") ?? session.host;
  const forwardedProto = incomingHeaders.get("x-forwarded-proto") ?? "http";

  const normalizedPath = apiPath.startsWith("/api/")
    ? apiPath
    : apiPath.startsWith("/")
      ? `/api${apiPath}`
      : `/api/${apiPath}`;

  const url = `${getApiBaseUrl()}${normalizedPath}`;

  try {
    const response = await fetch(url, {
      ...init,
      headers: {
        Accept: "application/json, application/problem+json",
        Authorization: `Bearer ${session.tokens.accessToken}`,
        "X-Forwarded-Host": forwardedHost,
        "X-Forwarded-Proto": forwardedProto,
        ...init?.headers,
      },
      cache: "no-store",
    });

    if (response.ok) {
      if (response.status === 204) {
        return {
          ok: true,
          status: 204,
          data: undefined as T,
        };
      }
      const data = (await response.json()) as T;
      return {
        ok: true,
        status: response.status,
        data,
      };
    }

    let problem: ProblemDetails = {
      title: "Error en la solicitud a la API",
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
      // Fallback to default problem details if response body is not JSON
    }

    return {
      ok: false,
      status: response.status,
      problem,
    };
  } catch {
    return {
      ok: false,
      status: 502,
      problem: {
        title: "API interna no disponible",
        status: 502,
        detail: "No fue posible conectar con el servidor de API interno.",
      },
    };
  }
}
