import { bffFetch } from "@/lib/api/bff-client";
import type {
  ApiResult,
  CreateGuardianRequest,
  CreateStudentRequest,
  EnrollmentsOverviewDto,
  EnrollStudentRequest,
  GuardianDto,
  LinkStudentGuardianRequest,
  StudentDirectoryOverviewDto,
  StudentDto,
  StudentEnrollmentDto,
  StudentGuardianSummaryDto,
  TransferStudentSectionRequest,
} from "@/lib/api/types";

export async function fetchStudentDirectoryOverview(): Promise<
  ApiResult<StudentDirectoryOverviewDto>
> {
  return bffFetch<StudentDirectoryOverviewDto>("tenant/students/overview");
}

export async function createStudent(
  payload: CreateStudentRequest,
  csrfToken: string,
): Promise<ApiResult<StudentDto>> {
  return bffFetch<StudentDto>("tenant/students", {
    method: "POST",
    body: payload,
    csrfToken,
  });
}

export async function deactivateStudent(
  studentId: string,
  csrfToken: string,
): Promise<ApiResult<void>> {
  return bffFetch<void>(`tenant/students/${encodeURIComponent(studentId)}/deactivate`, {
    method: "POST",
    csrfToken,
  });
}

export async function activateStudent(
  studentId: string,
  csrfToken: string,
): Promise<ApiResult<void>> {
  return bffFetch<void>(`tenant/students/${encodeURIComponent(studentId)}/activate`, {
    method: "POST",
    csrfToken,
  });
}

export async function createGuardian(
  payload: CreateGuardianRequest,
  csrfToken: string,
): Promise<ApiResult<GuardianDto>> {
  return bffFetch<GuardianDto>("tenant/students/guardians", {
    method: "POST",
    body: payload,
    csrfToken,
  });
}

export async function linkStudentGuardian(
  studentId: string,
  payload: LinkStudentGuardianRequest,
  csrfToken: string,
): Promise<ApiResult<StudentGuardianSummaryDto>> {
  return bffFetch<StudentGuardianSummaryDto>(
    `tenant/students/${encodeURIComponent(studentId)}/guardians`,
    {
      method: "POST",
      body: payload,
      csrfToken,
    },
  );
}

export async function fetchEnrollmentsOverview(): Promise<ApiResult<EnrollmentsOverviewDto>> {
  return bffFetch<EnrollmentsOverviewDto>("tenant/enrollments/overview");
}

export async function enrollStudent(
  payload: EnrollStudentRequest,
  csrfToken: string,
): Promise<ApiResult<StudentEnrollmentDto>> {
  return bffFetch<StudentEnrollmentDto>("tenant/enrollments", {
    method: "POST",
    body: payload,
    csrfToken,
  });
}

export async function transferStudentSection(
  enrollmentId: string,
  payload: TransferStudentSectionRequest,
  csrfToken: string,
): Promise<ApiResult<StudentEnrollmentDto>> {
  return bffFetch<StudentEnrollmentDto>(
    `tenant/enrollments/${encodeURIComponent(enrollmentId)}/transfer-section`,
    {
      method: "POST",
      body: payload,
      csrfToken,
    },
  );
}

export async function withdrawEnrollment(
  enrollmentId: string,
  csrfToken: string,
): Promise<ApiResult<void>> {
  return bffFetch<void>(`tenant/enrollments/${encodeURIComponent(enrollmentId)}/withdraw`, {
    method: "POST",
    csrfToken,
  });
}
