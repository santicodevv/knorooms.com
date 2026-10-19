import { NextResponse, type NextRequest } from "next/server";
import { constantTimeTokenEquals } from "@/lib/auth/csrf";
import { deriveRequestOrigin, exchangeAuthorizationCode } from "@/lib/auth/oidc";
import { sanitizeReturnTo } from "@/lib/auth/return-to";
import {
  buildSessionCookieOptions,
  consumeOidcTransaction,
  createSession,
  getOidcTransactionCookieName,
  getSessionCookieName,
  isSessionCookieSecure,
} from "@/lib/auth/session-store";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const txCookieName = getOidcTransactionCookieName();
  const txId = request.cookies.get(txCookieName)?.value;

  if (!txId) {
    return NextResponse.json(
      {
        title: "Transacción de autenticación inválida",
        status: 400,
        detail: "No se encontró una transacción activa de inicio de sesión vinculada al navegador.",
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

  const transaction = await consumeOidcTransaction(txId);
  if (!transaction) {
    return NextResponse.json(
      {
        title: "Transacción de autenticación expirada",
        status: 400,
        detail: "La solicitud de inicio de sesión ha expirado o ya fue utilizada.",
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

  const { host, origin } = deriveRequestOrigin(request);
  if (!constantTimeTokenEquals(host.toLowerCase(), transaction.host.toLowerCase())) {
    return NextResponse.json(
      {
        title: "Discrepancia de host en callback OIDC",
        status: 400,
        detail: "El host de retorno no coincide con el host que inició la autenticación.",
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

  const callbackUrl = new URL(`${origin}/api/auth/callback${request.nextUrl.search}`);

  try {
    const exchanged = await exchangeAuthorizationCode({
      currentUrl: callbackUrl,
      expectedState: transaction.state,
      expectedNonce: transaction.nonce,
      codeVerifier: transaction.codeVerifier,
    });

    const session = await createSession({
      user: exchanged.user,
      tokens: exchanged.tokens,
      host: host.toLowerCase(),
    });

    const destination = new URL(sanitizeReturnTo(transaction.returnTo, "/"), origin);
    const response = NextResponse.redirect(destination.toString(), { status: 302 });
    response.headers.set("Cache-Control", "no-store");

    // Clear short-lived OIDC transaction cookie
    response.cookies.set(txCookieName, "", {
      httpOnly: true,
      secure: isSessionCookieSecure(),
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });

    // Set host-only session cookie
    response.cookies.set(getSessionCookieName(), session.sessionId, buildSessionCookieOptions());

    return response;
  } catch (error) {
    const detail =
      error instanceof Error
        ? error.message
        : "No fue posible validar el código de autorización con el proveedor OIDC.";

    return NextResponse.json(
      {
        title: "Error en el intercambio OIDC",
        status: 401,
        detail,
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
}
