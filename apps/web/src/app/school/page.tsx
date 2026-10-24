import { SchoolRouteBoundary } from "@/features/school/components/school-route-boundary";
import { SchoolShell } from "@/components/school/school-shell";
import { SchoolDashboard } from "@/features/school/components/school-dashboard";
import { getSchoolContext } from "@/features/school/server/school-context";
import { serverApiFetch } from "@/lib/api/server-api";
import type {
  AcademicStructureOverviewDto,
  StudentDirectoryOverviewDto,
  EnrollmentsOverviewDto,
} from "@/lib/api/types";
async function SchoolHomeContent() {
  const data = await getSchoolContext();
  const context = data.contextResult?.ok ? data.contextResult.data : null;
  const permissions = context?.permissions ?? [];
  const [academic, directory, enrollments] = context
    ? await Promise.all([
        permissions.includes("institution.academic.read")
          ? serverApiFetch<AcademicStructureOverviewDto>("/api/tenant/academic/overview")
          : Promise.resolve(null),
        permissions.includes("institution.students.read")
          ? serverApiFetch<StudentDirectoryOverviewDto>("/api/tenant/students/overview")
          : Promise.resolve(null),
        permissions.includes("institution.enrollments.read")
          ? serverApiFetch<EnrollmentsOverviewDto>("/api/tenant/enrollments/overview")
          : Promise.resolve(null),
      ])
    : [null, null, null];
  return (
    <SchoolShell {...data} returnTo="/" activeTab="overview">
      {context && data.session && (
        <SchoolDashboard
          data={{
            name: data.session.user.name,
            permissions,
            academic: academic?.ok ? academic.data : null,
            directory: directory?.ok ? directory.data : null,
            enrollments: enrollments?.ok ? enrollments.data : null,
          }}
        />
      )}
    </SchoolShell>
  );
}

export default function Page() {
  return (
    <SchoolRouteBoundary>
      <SchoolHomeContent />
    </SchoolRouteBoundary>
  );
}
