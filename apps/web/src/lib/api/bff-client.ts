import type { ApiResult, ProblemDetails } from "@/lib/api/types";

export interface BffRequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  csrfToken?: string | null;
  headers?: Record<string, string>;
}

export async function bffFetch<T = void>(
  bffSubpath: string,
  options?: BffRequestOptions,
): Promise<ApiResult<T>> {
  const cleanSubpath = bffSubpath.replace(/^\/+/, "").replace(/^api\/bff\//, "");
  const url = `/api/bff/${cleanSubpath}`;
  const method = options?.method ?? "GET";

  const headers: Record<string, string> = {
    Accept: "application/json, application/problem+json",
    ...options?.headers,
  };

  if (options?.csrfToken) {
    headers["X-CSRF-Token"] = options.csrfToken;
  }

  let serializedBody: string | undefined;
  if (options?.body !== undefined) {
    headers["Content-Type"] = "application/json";
    serializedBody = JSON.stringify(options.body);
  }

  try {
    const response = await fetch(url, {
      method,
      headers,
      body: serializedBody,
      credentials: "same-origin",
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
      title: "No se pudo completar la operación",
      status: response.status,
    };

    try {
      const body = (await response.json()) as Partial<ProblemDetails>;
      problem = {
        type: body.type,
        title: body.title ?? problem.title,
        status: body.status ?? response.status,
        detail: body.detail,
        traceId: body.traceId,
        errors: body.errors,
      };
    } catch {
      // Non-JSON error body
    }

    return {
      ok: false,
      status: response.status,
      problem,
    };
  } catch {
    return {
      ok: false,
      status: 503,
      problem: {
        title: "Error de red",
        status: 503,
        detail: "No fue posible comunicarse con el servidor de aplicación (BFF).",
      },
    };
  }
}
