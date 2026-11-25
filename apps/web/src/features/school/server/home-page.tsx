import "server-only";
import { SchoolShell } from "@/components/school/school-shell";
import { SchoolDashboard } from "../components/school-dashboard";
import { SchoolCommercialStatus } from "@/features/subscriptions/components/school-commercial-status";
import { getSchoolCapabilities, getSchoolContext, schoolViewKey } from "./school-context";
import { serverApiFetch } from "@/lib/api/server-api";
import type {
  AcademicStructureOverviewDto,
  StudentDirectoryOverviewDto,
  EnrollmentsOverviewDto,
} from "@/lib/api/types";
import type { SchoolDashboardProblem } from "../hooks/use-school-dashboard";

export async function SchoolHomeContent() {
  const data = await getSchoolContext();
  const context = data.contextResult?.ok ? data.contextResult.data : null;
  const permissions = context?.permissions ?? [];
  const capabilitiesResult = context ? await getSchoolCapabilities() : null;
  const capabilities = capabilitiesResult?.ok ? capabilitiesResult.data : null;
  const readable = (permission: string, module: string) =>
    permissions.includes(permission) &&
    capabilities?.modules.some((item) => item.code === module && item.canRead) === true;
  const [academic, directory, enrollments] = context
    ? await Promise.all([
        readable("institution.academic.read", "academic")
          ? serverApiFetch<AcademicStructureOverviewDto>("/api/tenant/academic/overview")
          : Promise.resolve(null),
        readable("institution.students.read", "students")
          ? serverApiFetch<StudentDirectoryOverviewDto>("/api/tenant/students/overview")
          : Promise.resolve(null),
        readable("institution.enrollments.read", "enrollments")
          ? serverApiFetch<EnrollmentsOverviewDto>("/api/tenant/enrollments/overview")
          : Promise.resolve(null),
      ])
    : [null, null, null];
  const problems: SchoolDashboardProblem[] = [];
  if (capabilitiesResult && !capabilitiesResult.ok)
    problems.push({ source: "capabilities", problem: capabilitiesResult.problem });
  if (academic && !academic.ok) problems.push({ source: "academic", problem: academic.problem });
  if (directory && !directory.ok)
    problems.push({ source: "directory", problem: directory.problem });
  if (enrollments && !enrollments.ok)
    problems.push({ source: "enrollments", problem: enrollments.problem });
  return (
    <SchoolShell {...data} returnTo="/" activeTab="overview" hideCommercialStatus>
      {context && data.session && (
        <SchoolDashboard
          key={schoolViewKey(["home"], academic, directory, enrollments, capabilities)}
          data={{
            name: data.session.user.name,
            institutionStatus: context.tenant.status,
            permissions,
            academic: academic?.ok
              ? {
                  academicYears: academic.data.academicYears.map(
                    ({ id, code, startDate, isClosed }) => ({ id, code, startDate, isClosed }),
                  ),
                }
              : null,
            directory: directory?.ok
              ? { students: directory.data.students.map(({ id, isActive }) => ({ id, isActive })) }
              : null,
            enrollments: enrollments?.ok
              ? {
                  enrollments: enrollments.data.enrollments.map(
                    ({ studentId, academicYearId, status, enrolledAtUtc }) => ({
                      studentId,
                      academicYearId,
                      status,
                      enrolledAtUtc,
                    }),
                  ),
                  sectionCapacities: enrollments.data.sectionCapacities.map(
                    ({
                      sectionId,
                      academicYearId,
                      gradeLevelName,
                      sectionCode,
                      capacity,
                      activeEnrollmentsCount,
                      availableSeats,
                    }) => ({
                      sectionId,
                      academicYearId,
                      gradeLevelName,
                      sectionCode,
                      capacity,
                      activeEnrollmentsCount,
                      availableSeats,
                    }),
                  ),
                }
              : null,
            capabilities,
            problems,
          }}
          commercialStatus={
            capabilitiesResult?.ok ? (
              <SchoolCommercialStatus accessResult={capabilitiesResult} />
            ) : undefined
          }
        />
      )}
    </SchoolShell>
  );
}
