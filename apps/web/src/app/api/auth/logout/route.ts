import { NextResponse, type NextRequest } from "next/server";
import { revokeBackendRefreshToken } from "@/lib/auth/backend-auth";
import { verifyCsrfProtection } from "@/lib/auth/csrf";
import { deriveRequestOrigin } from "@/lib/auth/request-origin";
import {
  getSessionCookieName,
  getValidSessionById,
  isSessionCookieSecure,
  revokeSession,
} from "@/lib/auth/session-store";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const cookieName = getSessionCookieName();
  const sessionId = request.cookies.get(cookieName)?.value;
  const session = await getValidSessionById(sessionId);

  if (!session) {
    const response = NextResponse.json(
      {
        title: "Sesión no activa",
        status: 401,
        detail: "No existe una sesión autenticada activa para cerrar.",
      },
      {
        status: 401,
        headers: {
          "Content-Type": "application/problem+json",
          "Cache-Control": "no-store",
        },
      },
    );
    response.cookies.set(cookieName, "", {
      httpOnly: true,
      secure: isSessionCookieSecure(),
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
    return response;
  }

  const { host } = deriveRequestOrigin(request);
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
        title: "Verificación CSRF fallida",
        status: 403,
        detail: `Solicitud rechazada por protección CSRF (${csrfCheck.reason}).`,
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

  await revokeBackendRefreshToken(session.tokens.refreshToken);
  await revokeSession(session.sessionId);

  const response = NextResponse.json(
    {
      loggedOut: true,
      redirectTo: "/",
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );

  response.cookies.set(cookieName, "", {
    httpOnly: true,
    secure: isSessionCookieSecure(),
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return response;
}
