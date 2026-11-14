import { headers } from "next/headers";
import { MembersManager } from "@/components/school/members-manager";
import { SchoolShell } from "@/components/school/school-shell";
import { StaffInvitationsPanel } from "@/features/school/components/staff-invitations-panel";
import { SchoolRouteBoundary } from "@/features/school/components/school-route-boundary";
import { getServerSession } from "@/lib/auth/session-store";
import { serverApiFetch } from "@/lib/api/server-api";
import { resolveHost } from "@/lib/tenancy/host";
import type {
  InstitutionStaffInvitationDto,
  MemberDto,
  RoleDto,
  TenantContextDto,
} from "@/lib/api/types";

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
  const [invitationsResult, rolesResult] = canManageMembers
    ? await Promise.all([
        serverApiFetch<InstitutionStaffInvitationDto[]>("/api/tenant/staff-invitations"),
        serverApiFetch<RoleDto[]>("/api/tenant/roles"),
      ])
    : [null, null];

  const assignableRoles =
    rolesResult?.ok && contextResult?.ok
      ? rolesResult.data.filter((role) =>
          role.permissions.every((permission) =>
            contextResult.data.permissions.includes(permission),
          ),
        )
      : [];

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
        <div className="space-y-6">
          <MembersManager
            initialMembers={membersResult?.ok ? membersResult.data : []}
            initialProblem={membersResult && !membersResult.ok ? membersResult.problem : null}
            csrfToken={session.csrfToken}
            canManageMembers={canManageMembers}
          />
          {canManageMembers ? (
            <StaffInvitationsPanel
              initialInvitations={invitationsResult?.ok ? invitationsResult.data : []}
              roles={assignableRoles}
              csrfToken={session.csrfToken}
              initialProblem={
                invitationsResult && !invitationsResult.ok
                  ? invitationsResult.problem
                  : rolesResult && !rolesResult.ok
                    ? rolesResult.problem
                    : null
              }
            />
          ) : null}
        </div>
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
