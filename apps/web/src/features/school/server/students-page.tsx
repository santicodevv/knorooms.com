import "server-only";
import { schoolViewKey, getSchoolCapabilities, getSchoolContext } from "./school-context";
import { SchoolPageAccess } from "@/components/school/school-page-access";
import { StudentsWorkspace } from "@/features/school/students/components/students-workspace";
import { serverApiFetch } from "@/lib/api/server-api";
import type { EnrollmentsOverviewDto, StudentDirectoryOverviewDto } from "@/lib/api/types";

const EMPTY_DIRECTORY: StudentDirectoryOverviewDto = {
  students: [],
  guardians: [],
};

const EMPTY_ENROLLMENTS: EnrollmentsOverviewDto = {
  enrollments: [],
  sectionCapacities: [],
};

export async function SchoolStudentsPage({ path = [] }: { path?: string[] } = {}) {
  const { session, contextResult, rawHost, slug } = await getSchoolContext();
  const capabilities = session && contextResult?.ok ? await getSchoolCapabilities() : null;
  const readable = (code: string) =>
    Boolean(
      capabilities?.ok && capabilities.data.modules.some((m) => m.code === code && m.canRead),
    );
  const writable = (code: string) =>
    Boolean(
      capabilities?.ok && capabilities.data.modules.some((m) => m.code === code && m.canWrite),
    );
  const canReadStudents = Boolean(
    contextResult?.ok &&
    contextResult.data.permissions.includes("institution.students.read") &&
    readable("students"),
  );
  const canManageStudents = Boolean(
    contextResult?.ok &&
    contextResult.data.permissions.includes("institution.students.manage") &&
    writable("students"),
  );
  const canReadEnrollments = Boolean(
    contextResult?.ok &&
    contextResult.data.permissions.includes("institution.enrollments.read") &&
    readable("enrollments"),
  );
  const canManageEnrollments = Boolean(
    contextResult?.ok &&
    contextResult.data.permissions.includes("institution.enrollments.manage") &&
    writable("enrollments"),
  );

  const [directoryResult, enrollmentsResult] =
    session && contextResult?.ok
      ? await Promise.all([
          canReadStudents
            ? serverApiFetch<StudentDirectoryOverviewDto>("/api/tenant/students/overview")
            : Promise.resolve(null),
          canReadEnrollments
            ? serverApiFetch<EnrollmentsOverviewDto>("/api/tenant/enrollments/overview")
            : Promise.resolve(null),
        ])
      : [null, null];

  const initialProblem =
    (capabilities && !capabilities.ok ? capabilities.problem : null) ??
    (directoryResult && !directoryResult.ok ? directoryResult.problem : null) ??
    (enrollmentsResult && !enrollmentsResult.ok ? enrollmentsResult.problem : null);

  return (
    <SchoolPageAccess
      session={session}
      rawHost={rawHost}
      slug={slug}
      returnTo={"/" + path.join("/")}
      activeTab={
        path[0] === "enrollments"
          ? "enrollments"
          : path[0] === "guardians"
            ? "guardians"
            : "students"
      }
      contextResult={contextResult}
    >
      {session && contextResult?.ok ? (
        <StudentsWorkspace
          key={schoolViewKey(
            path,
            directoryResult?.ok ? directoryResult.data : null,
            enrollmentsResult?.ok ? enrollmentsResult.data : null,
            capabilities,
            contextResult.data.permissions,
          )}
          path={path}
          initialDirectory={directoryResult?.ok ? directoryResult.data : EMPTY_DIRECTORY}
          initialEnrollments={enrollmentsResult?.ok ? enrollmentsResult.data : EMPTY_ENROLLMENTS}
          initialProblem={initialProblem}
          csrfToken={session.csrfToken}
          canManageStudents={canManageStudents}
          canManageEnrollments={canManageEnrollments}
          canReadStudents={canReadStudents}
          canReadEnrollments={canReadEnrollments}
          directoryAvailable={directoryResult?.ok === true}
          enrollmentsAvailable={enrollmentsResult?.ok === true}
        />
      ) : null}
    </SchoolPageAccess>
  );
}
