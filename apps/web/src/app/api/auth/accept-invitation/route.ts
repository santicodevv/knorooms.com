import { NextResponse, type NextRequest } from "next/server";
import { validateOriginMatchesHost } from "@/lib/auth/csrf";
import { deriveRequestOrigin } from "@/lib/auth/request-origin";
import { resolveHost } from "@/lib/tenancy/host";
import { acceptInvitationSchema } from "@/features/auth/schemas/invitation-schema";
export async function POST(request: NextRequest) {
  const { host } = deriveRequestOrigin(request);
  const headers = { "Cache-Control": "no-store", "Content-Type": "application/problem+json" };
  if (
    !validateOriginMatchesHost(request.headers.get("origin"), host).ok ||
    resolveHost(host).kind !== "tenant"
  )
    return NextResponse.json(
      { status: 403, title: "Solicitud no autorizada" },
      { status: 403, headers },
    );
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { status: 400, title: "Solicitud inválida" },
      { status: 400, headers },
    );
  }
  const parsed = acceptInvitationSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json(
      { status: 400, title: "Revise los datos de la invitación" },
      { status: 400, headers },
    );
  try {
    const api = (process.env.API_BASE_URL ?? "http://localhost:5080").replace(/\/$/, "");
    const response = await fetch(`${api}/api/invitations/accept`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Forwarded-Host": host },
      body: JSON.stringify(parsed.data),
      cache: "no-store",
      signal: AbortSignal.timeout(20000),
    });
    if (response.ok)
      return new NextResponse(null, { status: 204, headers: { "Cache-Control": "no-store" } });
    let problem: unknown = { status: response.status, title: "No se pudo aceptar la invitación" };
    try {
      problem = await response.json();
    } catch {
      /* La API puede limitar las solicitudes sin cuerpo JSON. */
    }
    return NextResponse.json(problem, { status: response.status, headers });
  } catch {
    return NextResponse.json(
      { status: 503, title: "Servicio no disponible" },
      { status: 503, headers },
    );
  }
}
