import { headers } from "next/headers";
import { SchoolShell } from "@/components/school/school-shell";
import { AcademicWorkspace } from "@/features/school/academic/components/academic-workspace";
import { serverApiFetch } from "@/lib/api/server-api";
import type { AcademicStructureOverviewDto, MemberDto, TenantContextDto } from "@/lib/api/types";
import { getServerSession } from "@/lib/auth/session-store";
import { resolveHost } from "@/lib/tenancy/host";

const EMPTY_OVERVIEW: AcademicStructureOverviewDto = {
  academicYears: [],
  gradeLevels: [],
  sections: [],
  subjects: [],
  teacherAssignments: [],
};

export default async function SchoolAcademicPage() {
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

  const canReadAcademic = Boolean(
    contextResult?.ok && contextResult.data.permissions.includes("institution.academic.read"),
  );
  const canManageAcademic = Boolean(
    contextResult?.ok && contextResult.data.permissions.includes("institution.academic.manage"),
  );
  const canReadMembers = Boolean(
    contextResult?.ok && contextResult.data.permissions.includes("institution.members.read"),
  );

  const [overviewResult, membersResult] =
    session && contextResult?.ok && canReadAcademic
      ? await Promise.all([
          serverApiFetch<AcademicStructureOverviewDto>("/api/tenant/academic/overview"),
          canReadMembers
            ? serverApiFetch<MemberDto[]>("/api/tenant/members")
            : Promise.resolve(null),
        ])
      : [null, null];

  return (
    <SchoolShell
      session={session}
      rawHost={rawHost}
      slug={slug}
      returnTo="/academic"
      activeTab="academic"
      contextResult={contextResult}
    >
      {session && contextResult?.ok ? (
        <AcademicWorkspace
          initialOverview={overviewResult?.ok ? overviewResult.data : EMPTY_OVERVIEW}
          initialProblem={overviewResult && !overviewResult.ok ? overviewResult.problem : null}
          members={membersResult?.ok ? membersResult.data : []}
          csrfToken={session.csrfToken}
          canManageAcademic={canManageAcademic}
        />
      ) : null}
    </SchoolShell>
  );
}
