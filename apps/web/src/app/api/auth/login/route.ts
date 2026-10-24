import { NextResponse, type NextRequest } from "next/server";
import { loginWithPassword, toSessionUser } from "@/lib/auth/backend-auth";
import { validateOriginMatchesHost } from "@/lib/auth/csrf";
import { deriveRequestOrigin } from "@/lib/auth/request-origin";
import { sanitizeReturnTo } from "@/lib/auth/return-to";
import {
  buildSessionCookieOptions,
  createSession,
  getSessionCookieName,
  type StoredSessionRecord,
} from "@/lib/auth/session-store";

interface LoginBody {
  email?: unknown;
  password?: unknown;
  returnTo?: unknown;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const { host, proto } = deriveRequestOrigin(request);

  // El inicio de sesión muta estado (crea sesión): exigimos que el Origin coincida con el host.
  const originCheck = validateOriginMatchesHost(request.headers.get("origin"), host);
  if (!originCheck.ok) {
    return NextResponse.json(
      {
        title: "Solicitud rechazada por protección CSRF",
        status: 403,
        detail: `No se pudo verificar el origen de la solicitud (${originCheck.reason}).`,
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

  let body: LoginBody;
  try {
    body = (await request.json()) as LoginBody;
  } catch {
    return NextResponse.json(
      {
        title: "Solicitud inválida",
        status: 400,
        detail: "El cuerpo de la solicitud debe ser JSON válido.",
      },
      {
        status: 400,
        headers: {
          "Content-Type": "application/problem+json",
          "Cache-Control": "no-store",
        },
      },
    );
  }

  const email = typeof body.email === "string" ? body.email.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const returnTo = sanitizeReturnTo(typeof body.returnTo === "string" ? body.returnTo : null, "/");

  if (!email || !password) {
    return NextResponse.json(
      {
        title: "Datos incompletos",
        status: 400,
        detail: "El correo electrónico y la contraseña son obligatorios.",
      },
      {
        status: 400,
        headers: {
          "Content-Type": "application/problem+json",
          "Cache-Control": "no-store",
        },
      },
    );
  }

  const result = await loginWithPassword({
    email,
    password,
    forwardedHost: host,
    forwardedProto: proto,
  });

  if (!result.ok) {
    return NextResponse.json(
      {
        title: result.problem.title,
        status: result.problem.status,
        detail: result.problem.detail,
      },
      {
        status: result.problem.status,
        headers: {
          "Content-Type": "application/problem+json",
          "Cache-Control": "no-store",
        },
      },
    );
  }

  let session: StoredSessionRecord;
  try {
    session = await createSession({
      user: toSessionUser(result.tokens),
      tokens: {
        accessToken: result.tokens.accessToken,
        refreshToken: result.tokens.refreshToken,
        accessTokenExpiresAt: new Date(result.tokens.accessTokenExpiresAtUtc).getTime(),
      },
      host: host.toLowerCase(),
    });
  } catch {
    return NextResponse.json(
      {
        title: "Sesión no disponible",
        status: 503,
        detail: "No fue posible guardar la sesión. Inténtelo nuevamente en unos segundos.",
      },
      {
        status: 503,
        headers: { "Content-Type": "application/problem+json", "Cache-Control": "no-store" },
      },
    );
  }

  const response = NextResponse.json(
    {
      authenticated: true,
      returnTo,
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );

  response.cookies.set(getSessionCookieName(), session.sessionId, buildSessionCookieOptions());

  return response;
}
