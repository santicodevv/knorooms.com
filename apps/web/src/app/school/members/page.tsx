import { SchoolRouteBoundary } from "@/features/school/components/school-route-boundary";
import { headers } from "next/headers";
import { MembersManager } from "@/components/school/members-manager";
import { SchoolShell } from "@/components/school/school-shell";
import { serverApiFetch } from "@/lib/api/server-api";
import type { MemberDto, TenantContextDto } from "@/lib/api/types";
import { getServerSession } from "@/lib/auth/session-store";
import { resolveHost } from "@/lib/tenancy/host";

async function SchoolMembersPage() {
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

  const membersResult =
    session && contextResult?.ok ? await serverApiFetch<MemberDto[]>("/api/tenant/members") : null;

  const canManageMembers = Boolean(
    contextResult?.ok && contextResult.data.permissions.includes("institution.members.manage"),
  );

  return (
    <SchoolShell
      session={session}
      rawHost={rawHost}
      slug={slug}
      returnTo="/members"
      activeTab="members"
      contextResult={contextResult}
    >
      {session && contextResult?.ok ? (
        <MembersManager
          initialMembers={membersResult?.ok ? membersResult.data : []}
          initialProblem={membersResult && !membersResult.ok ? membersResult.problem : null}
          csrfToken={session.csrfToken}
          canManageMembers={canManageMembers}
        />
      ) : null}
    </SchoolShell>
  );
}

export default function Page() {
  return (
    <SchoolRouteBoundary>
      <SchoolMembersPage />
    </SchoolRouteBoundary>
  );
}
