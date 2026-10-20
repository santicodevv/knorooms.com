import { NextResponse, type NextRequest } from "next/server";
import { isMutatingMethod, verifyCsrfProtection } from "@/lib/auth/csrf";
import { deriveRequestOrigin } from "@/lib/auth/request-origin";
import { getSessionCookieName, getValidSessionById } from "@/lib/auth/session-store";

export function isAllowedBffPath(segments: string[]): boolean {
  if (!segments || segments.length === 0) {
    return false;
  }

  for (const segment of segments) {
    if (!segment || segment === "." || segment === ".." || segment.includes("\\")) {
      return false;
    }
  }

  const joined = segments.join("/");
  return joined === "me" || joined.startsWith("platform/") || joined.startsWith("tenant/");
}

function getApiBaseUrl(): string {
  return (process.env.API_BASE_URL ?? "http://localhost:5080").trim().replace(/\/$/, "");
}

async function handleBffProxy(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
): Promise<NextResponse> {
  const { path } = await context.params;

  if (!isAllowedBffPath(path)) {
    return NextResponse.json(
      {
        title: "Ruta BFF no permitida",
        status: 404,
        detail: "El prefijo solicitado no está habilitado en el proxy BFF.",
      },
      {
        status: 404,
        headers: {
          "Content-Type": "application/problem+json",
          "Cache-Control": "no-store",
        },
      },
    );
  }

  const cookieName = getSessionCookieName();
  const sessionId = request.cookies.get(cookieName)?.value;
  const session = await getValidSessionById(sessionId);

  if (!session) {
    return NextResponse.json(
      {
        title: "No autenticado",
        status: 401,
        detail: "Su sesión ha expirado o no ha iniciado sesión.",
      },
      {
        status: 401,
        headers: {
          "Content-Type": "application/problem+json",
          "Cache-Control": "no-store",
        },
      },
    );
  }

  const { host, proto } = deriveRequestOrigin(request);

  if (isMutatingMethod(request.method)) {
    const csrfCheck = verifyCsrfProtection({
      method: request.method,
      headerToken: request.headers.get("x-csrf-token"),
      sessionToken: session.csrfToken,
      originHeader: request.headers.get("origin"),
      expectedHost: host,
    });

    if (!csrfCheck.ok) {
      return NextResponse.json(
        {
          title: "Solicitud rechazada por protección CSRF",
          status: 403,
          detail: `No se pudo verificar la autenticidad del origen o token CSRF (${csrfCheck.reason}).`,
        },
        {
          status: 403,
          headers: {
            "Content-Type": "application/problem+json",
            "Cache-Control": "no-store",
          },
        },
      );
    }
  }

  const encodedPath = path.map((segment) => encodeURIComponent(segment)).join("/");
  const upstreamUrl = `${getApiBaseUrl()}/api/${encodedPath}${request.nextUrl.search}`;

  // Explicitly construct headers without forwarding Cookie
  const upstreamHeaders = new Headers();
  upstreamHeaders.set("Authorization", `Bearer ${session.tokens.accessToken}`);
  upstreamHeaders.set("X-Forwarded-Host", host);
  upstreamHeaders.set("X-Forwarded-Proto", proto);
  upstreamHeaders.set(
    "Accept",
    request.headers.get("accept") ?? "application/json, application/problem+json",
  );

  const contentType = request.headers.get("content-type");
  if (contentType) {
    upstreamHeaders.set("Content-Type", contentType);
  }

  const hasBody = !["GET", "HEAD"].includes(request.method.toUpperCase());
  const bodyBuffer = hasBody ? await request.arrayBuffer() : undefined;

  try {
    const upstreamResponse = await fetch(upstreamUrl, {
      method: request.method,
      headers: upstreamHeaders,
      body: bodyBuffer && bodyBuffer.byteLength > 0 ? bodyBuffer : undefined,
      cache: "no-store",
      redirect: "manual",
    });

    const responseHeaders = new Headers();
    responseHeaders.set("Cache-Control", "no-store");

    const upstreamContentType = upstreamResponse.headers.get("content-type");
    if (upstreamContentType) {
      responseHeaders.set("Content-Type", upstreamContentType);
    }

    if (upstreamResponse.status === 204) {
      return new NextResponse(null, {
        status: 204,
        headers: responseHeaders,
      });
    }

    const payload = await upstreamResponse.arrayBuffer();
    return new NextResponse(payload, {
      status: upstreamResponse.status,
      headers: responseHeaders,
    });
  } catch {
    return NextResponse.json(
      {
        title: "Servicio de API no disponible",
        status: 502,
        detail: "El BFF no pudo establecer comunicación con la API interna.",
      },
      {
        status: 502,
        headers: {
          "Content-Type": "application/problem+json",
          "Cache-Control": "no-store",
        },
      },
    );
  }
}

export const GET = handleBffProxy;
export const POST = handleBffProxy;
export const PUT = handleBffProxy;
export const PATCH = handleBffProxy;
export const DELETE = handleBffProxy;
