import { NextResponse, type NextRequest } from "next/server";
import { createAuthorizationRequest, deriveRequestOrigin } from "@/lib/auth/oidc";
import { sanitizeReturnTo } from "@/lib/auth/return-to";
import {
  buildOidcTransactionCookieOptions,
  createOidcTransaction,
  getOidcTransactionCookieName,
} from "@/lib/auth/session-store";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const rawReturnTo = request.nextUrl.searchParams.get("returnTo");
  const returnTo = sanitizeReturnTo(rawReturnTo, "/");
  const { host, origin } = deriveRequestOrigin(request);
  const redirectUri = `${origin}/api/auth/callback`;

  try {
    const authRequest = await createAuthorizationRequest(redirectUri);
    const tx = await createOidcTransaction({
      state: authRequest.state,
      nonce: authRequest.nonce,
      codeVerifier: authRequest.codeVerifier,
      returnTo,
      host: host.toLowerCase(),
    });

    const response = NextResponse.redirect(authRequest.authorizationUrl.toString(), {
      status: 302,
    });
    response.headers.set("Cache-Control", "no-store");
    response.cookies.set(
      getOidcTransactionCookieName(),
      tx.txId,
      buildOidcTransactionCookieOptions(),
    );

    return response;
  } catch (error) {
    const detail =
      error instanceof Error
        ? error.message
        : "No fue posible iniciar el flujo de autenticación OIDC.";

    return NextResponse.json(
      {
        title: "Error de configuración o conexión OIDC",
        status: 503,
        detail,
      },
      {
        status: 503,
        headers: {
          "Content-Type": "application/problem+json",
          "Cache-Control": "no-store",
        },
      },
    );
  }
}
