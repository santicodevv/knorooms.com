import "server-only";
import { SchoolPageAccess } from "@/components/school/school-page-access";
import { EnrollmentsWorkspace } from "../enrollments/components/enrollments-workspace";
import { getSchoolContext, getSchoolCapabilities, schoolViewKey } from "./school-context";
import { serverApiFetch } from "@/lib/api/server-api";
import type {
  AcademicStructureOverviewDto,
  EnrollmentsOverviewDto,
  StudentDirectoryOverviewDto,
} from "@/lib/api/types";
import type {
  EnrollmentProblem,
  EnrollmentsWorkspaceData,
} from "../enrollments/schemas/enrollment-types";

export async function SchoolEnrollmentsPage() {
  const context = await getSchoolContext();
  const permissions = context.contextResult?.ok ? context.contextResult.data.permissions : [];
  const capabilities =
    context.session && context.contextResult?.ok ? await getSchoolCapabilities() : null;
  const allowed = (permission: string, module: string, write = false) =>
    permissions.includes(permission) &&
    capabilities?.ok === true &&
    capabilities.data.modules.some(
      (item) => item.code === module && (write ? item.canWrite : item.canRead),
    );
  const canReadEnrollments = allowed("institution.enrollments.read", "enrollments");
  const canManageEnrollments = allowed("institution.enrollments.manage", "enrollments", true);
  const canReadStudents = allowed("institution.students.read", "students");
  const canReadAcademic = allowed("institution.academic.read", "academic");
  const [enrollments, academic, directory] = await Promise.all([
    canReadEnrollments
      ? serverApiFetch<EnrollmentsOverviewDto>("/api/tenant/enrollments/overview")
      : Promise.resolve(null),
    canReadEnrollments && canReadAcademic
      ? serverApiFetch<AcademicStructureOverviewDto>("/api/tenant/academic/overview")
      : Promise.resolve(null),
    canReadEnrollments && canManageEnrollments && canReadStudents
      ? serverApiFetch<StudentDirectoryOverviewDto>("/api/tenant/students/overview")
      : Promise.resolve(null),
  ]);
  const problems: EnrollmentProblem[] = [];
  if (capabilities && !capabilities.ok)
    problems.push({ source: "capabilities", problem: capabilities.problem });
  if (enrollments && !enrollments.ok)
    problems.push({ source: "enrollments", problem: enrollments.problem });
  if (academic && !academic.ok) problems.push({ source: "academic", problem: academic.problem });
  if (directory && !directory.ok) problems.push({ source: "students", problem: directory.problem });
  const data: EnrollmentsWorkspaceData = {
    years: academic?.ok
      ? academic.data.academicYears.map(({ id, code, isClosed }) => ({ id, code, isClosed }))
      : null,
    students: directory?.ok
      ? directory.data.students.map(
          ({ id, studentCode, fullName, sigerdExternalId, isActive }) => ({
            id,
            studentCode,
            fullName,
            sigerdExternalId,
            isActive,
          }),
        )
      : null,
    overview: enrollments?.ok
      ? {
          enrollments: enrollments.data.enrollments.map(
            ({
              id,
              studentId,
              studentCode,
              studentFullName,
              academicYearId,
              sectionId,
              status,
              enrolledAtUtc,
            }) => ({
              id,
              studentId,
              studentCode,
              studentFullName,
              academicYearId,
              sectionId,
              status,
              enrolledAtUtc,
            }),
          ),
          sectionCapacities: enrollments.data.sectionCapacities.map(
            ({
              sectionId,
              academicYearId,
              academicYearCode,
              isAcademicYearClosed,
              gradeLevelName,
              sectionCode,
              shift,
              capacity,
              activeEnrollmentsCount,
              availableSeats,
            }) => ({
              sectionId,
              academicYearId,
              academicYearCode,
              isAcademicYearClosed,
              gradeLevelName,
              sectionCode,
              shift,
              capacity,
              activeEnrollmentsCount,
              availableSeats,
            }),
          ),
        }
      : null,
    problems,
    canReadEnrollments,
    canManageEnrollments,
    canReadStudents,
    csrfToken: context.session?.csrfToken ?? "",
  };
  return (
    <SchoolPageAccess {...context} returnTo="/enrollments" activeTab="enrollments">
      {context.session && context.contextResult?.ok && (
        <EnrollmentsWorkspace key={schoolViewKey(["enrollments"], data)} data={data} />
      )}
    </SchoolPageAccess>
  );
}
