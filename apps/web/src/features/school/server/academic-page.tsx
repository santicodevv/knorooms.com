import "server-only";
import { schoolViewKey, getSchoolCapabilities, getSchoolContext } from "./school-context";
import { SchoolShell } from "@/components/school/school-shell";
import { AcademicWorkspace } from "@/features/school/academic/components/academic-workspace";
import { serverApiFetch } from "@/lib/api/server-api";
import type {
  AcademicStructureOverviewDto,
  EnrollmentsOverviewDto,
  MemberDto,
} from "@/lib/api/types";
const EMPTY_OVERVIEW: AcademicStructureOverviewDto = {
  academicYears: [],
  gradeLevels: [],
  sections: [],
  subjects: [],
  teacherAssignments: [],
};
export async function SchoolAcademicPage({ path = [] }: { path?: string[] } = {}) {
  const context = await getSchoolContext();
  const { session, contextResult } = context;
  const capabilities = session && contextResult?.ok ? await getSchoolCapabilities() : null;
  const permission = (value: string) =>
    contextResult?.ok === true && contextResult.data.permissions.includes(value);
  const readable = (code: string) =>
    capabilities?.ok === true &&
    capabilities.data.modules.some((item) => item.code === code && item.canRead);
  const writable = (code: string) =>
    capabilities?.ok === true &&
    capabilities.data.modules.some((item) => item.code === code && item.canWrite);
  const canReadAcademic = permission("institution.academic.read") && readable("academic");
  const canManageAcademic = permission("institution.academic.manage") && writable("academic");
  const canReadMembers = permission("institution.members.read");
  const canReadEnrollments = permission("institution.enrollments.read") && readable("enrollments");
  const [overviewResult, membersResult, capacitiesResult] = await Promise.all([
    canReadAcademic
      ? serverApiFetch<AcademicStructureOverviewDto>("/api/tenant/academic/overview")
      : Promise.resolve(null),
    canReadAcademic && canReadMembers && path[1] === "assignments"
      ? serverApiFetch<MemberDto[]>("/api/tenant/members")
      : Promise.resolve(null),
    canReadAcademic && canReadEnrollments && (path[1] === "grades" || path[1] === "sections")
      ? serverApiFetch<EnrollmentsOverviewDto>("/api/tenant/enrollments/overview")
      : Promise.resolve(null),
  ]);
  const initialProblem =
    (capabilities && !capabilities.ok ? capabilities.problem : null) ??
    (overviewResult && !overviewResult.ok ? overviewResult.problem : null) ??
    (membersResult && !membersResult.ok ? membersResult.problem : null) ??
    (capacitiesResult && !capacitiesResult.ok ? capacitiesResult.problem : null);
  return (
    <SchoolShell {...context} returnTo={"/" + path.join("/")} activeTab="academic">
      {session && contextResult?.ok ? (
        <AcademicWorkspace
          key={schoolViewKey(
            path,
            overviewResult,
            membersResult,
            capacitiesResult,
            capabilities,
            contextResult.data.permissions,
          )}
          path={path}
          initialOverview={overviewResult?.ok ? overviewResult.data : EMPTY_OVERVIEW}
          initialProblem={initialProblem}
          members={
            membersResult?.ok
              ? membersResult.data.map(({ membershipId, displayName, status }) => ({
                  membershipId,
                  displayName,
                  status,
                }))
              : []
          }
          csrfToken={session.csrfToken}
          canReadAcademic={canReadAcademic}
          canManageAcademic={canManageAcademic}
          canReadMembers={canReadMembers}
          membersAvailable={membersResult?.ok === true}
          overviewAvailable={overviewResult?.ok === true}
          canReadEnrollments={canReadEnrollments}
          initialSectionCapacities={
            capacitiesResult?.ok
              ? capacitiesResult.data.sectionCapacities.map(
                  ({ sectionId, capacity, activeEnrollmentsCount }) => ({
                    sectionId,
                    capacity,
                    activeEnrollmentsCount,
                  }),
                )
              : null
          }
        />
      ) : null}
    </SchoolShell>
  );
}
