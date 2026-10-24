import "server-only";
import { createHash } from "node:crypto";
import { cache } from "react";
import { headers } from "next/headers";
import { getServerSession } from "@/lib/auth/session-store";
import { serverApiFetch } from "@/lib/api/server-api";
import { resolveHost } from "@/lib/tenancy/host";
import type { TenantContextDto } from "@/lib/api/types";
import type { EffectiveAccess } from "@/features/subscriptions/schemas/subscription-schemas";
export const getSchoolContext = cache(async () => {
  const incoming = await headers(),
    rawHost = incoming.get("x-forwarded-host") ?? incoming.get("host") ?? "";
  const resolution = resolveHost(rawHost),
    slug = resolution.kind === "tenant" ? resolution.slug : "";
  const session = await getServerSession();
  const contextResult = session
    ? await serverApiFetch<TenantContextDto>("/api/tenant/context")
    : null;
  return { session, contextResult, rawHost, slug };
});
export const getSchoolCapabilities = cache(() =>
  serverApiFetch<EffectiveAccess>("/api/tenant/capabilities"),
);

export function schoolViewKey(path: string[], ...snapshots: unknown[]): string {
  return (
    path.join("/") +
    ":" +
    createHash("sha256").update(JSON.stringify(snapshots)).digest("hex").slice(0, 16)
  );
}
