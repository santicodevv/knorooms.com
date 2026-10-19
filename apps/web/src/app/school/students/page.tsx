import { headers } from "next/headers";
import { SchoolShell } from "@/components/school/school-shell";
import { StudentsWorkspace } from "@/features/school/students/components/students-workspace";
import { serverApiFetch } from "@/lib/api/server-api";
import type {
  EnrollmentsOverviewDto,
  StudentDirectoryOverviewDto,
  TenantContextDto,
} from "@/lib/api/types";
import { getServerSession } from "@/lib/auth/session-store";
import { resolveHost } from "@/lib/tenancy/host";

const EMPTY_DIRECTORY: StudentDirectoryOverviewDto = {
  students: [],
  guardians: [],
};

const EMPTY_ENROLLMENTS: EnrollmentsOverviewDto = {
  enrollments: [],
  sectionCapacities: [],
};

export default async function SchoolStudentsPage() {
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

  const canReadStudents = Boolean(
    contextResult?.ok && contextResult.data.permissions.includes("institution.students.read"),
  );
  const canManageStudents = Boolean(
    contextResult?.ok && contextResult.data.permissions.includes("institution.students.manage"),
  );
  const canReadEnrollments = Boolean(
    contextResult?.ok && contextResult.data.permissions.includes("institution.enrollments.read"),
  );
  const canManageEnrollments = Boolean(
    contextResult?.ok && contextResult.data.permissions.includes("institution.enrollments.manage"),
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
    (directoryResult && !directoryResult.ok ? directoryResult.problem : null) ??
    (enrollmentsResult && !enrollmentsResult.ok ? enrollmentsResult.problem : null);

  return (
    <SchoolShell
      session={session}
      rawHost={rawHost}
      slug={slug}
      returnTo="/students"
      activeTab="students"
      contextResult={contextResult}
    >
      {session && contextResult?.ok ? (
        <StudentsWorkspace
          initialDirectory={directoryResult?.ok ? directoryResult.data : EMPTY_DIRECTORY}
          initialEnrollments={enrollmentsResult?.ok ? enrollmentsResult.data : EMPTY_ENROLLMENTS}
          initialProblem={initialProblem}
          csrfToken={session.csrfToken}
          canManageStudents={canManageStudents}
          canManageEnrollments={canManageEnrollments}
        />
      ) : null}
    </SchoolShell>
  );
}
