import { NextResponse, type NextRequest } from "next/server";
import { resolveProxyRouting } from "@/lib/tenancy/host";

export function proxy(request: NextRequest): NextResponse {
  const rawHost = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const decision = resolveProxyRouting(rawHost, request.nextUrl.pathname);

  if (decision.type === "not-found") {
    return new NextResponse("Recurso o subdominio no encontrado (404).", {
      status: 404,
      headers: {
        "content-type": "text/plain; charset=utf-8",
      },
    });
  }

  const requestHeaders = new Headers(request.headers);
  if (rawHost) {
    requestHeaders.set("x-forwarded-host", rawHost);
  }
  requestHeaders.set("x-tenant-kind", decision.resolution.kind);
  if (decision.resolution.kind === "tenant") {
    requestHeaders.set("x-tenant-slug", decision.resolution.slug);
  }

  if (decision.type === "rewrite") {
    const rewriteUrl = request.nextUrl.clone();
    rewriteUrl.pathname = decision.targetPathname;
    return NextResponse.rewrite(rewriteUrl, {
      request: {
        headers: requestHeaders,
      },
    });
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
