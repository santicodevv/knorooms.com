import { headers } from "next/headers";
import { SchoolShell } from "@/components/school/school-shell";
import { SupportAccessManager } from "@/components/school/support-access-manager";
import { serverApiFetch } from "@/lib/api/server-api";
import type { SupportAccessGrantDto, TenantContextDto } from "@/lib/api/types";
import { getServerSession } from "@/lib/auth/session-store";
import { resolveHost } from "@/lib/tenancy/host";

export default async function SchoolSupportAccessPage() {
  const incomingHeaders = await headers();
  const rawHost =
    incomingHeaders.get("x-forwarded-host") ??
    incomingHeaders.get("host") ??
    "colegio.localhost:3000";
  const resolution = resolveHost(rawHost);
  const slug = resolution.kind === "tenant" ? resolution.slug : "";

  const session = await getServerSession();
  const contextResult = session
    ? await serverApiFetch<TenantContextDto>("/api/tenant/context")
    : null;

  const grantsResult =
    session && contextResult?.ok
      ? await serverApiFetch<SupportAccessGrantDto[]>("/api/tenant/support-access")
      : null;

  const canManageSupportAccess = Boolean(
    contextResult?.ok &&
    contextResult.data.permissions.includes("institution.support-access.manage"),
  );

  return (
    <SchoolShell
      session={session}
      rawHost={rawHost}
      slug={slug}
      returnTo="/support-access"
      activeTab="support-access"
      contextResult={contextResult}
    >
      {session && contextResult?.ok ? (
        <SupportAccessManager
          initialGrants={grantsResult?.ok ? grantsResult.data : []}
          initialProblem={grantsResult && !grantsResult.ok ? grantsResult.problem : null}
          csrfToken={session.csrfToken}
          canManageSupportAccess={canManageSupportAccess}
        />
      ) : null}
    </SchoolShell>
  );
}
