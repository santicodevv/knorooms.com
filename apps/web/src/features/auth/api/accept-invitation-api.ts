import type { AcceptInvitationValues } from "../schemas/invitation-schema";
import type { ProblemDetails } from "@/lib/api/types";
export async function acceptInvitation(
  values: AcceptInvitationValues,
): Promise<ProblemDetails | null> {
  try {
    const response = await fetch("/api/auth/accept-invitation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
      cache: "no-store",
    });
    if (response.ok) return null;
    return (await response.json()) as ProblemDetails;
  } catch {
    return { title: "No se pudo conectar", status: 503, detail: "Intente nuevamente." };
  }
}
