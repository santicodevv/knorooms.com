import { bffFetch } from "@/lib/api/bff-client";
import type {
  AcademicStructureOverviewDto,
  AcademicYearDto,
  ApiResult,
  AssignTeacherRequest,
  CreateAcademicYearRequest,
  CreateGradeLevelRequest,
  CreateSchoolSectionRequest,
  CreateSubjectRequest,
  GradeLevelDto,
  SchoolSectionDto,
  SubjectDto,
  TeacherAssignmentDto,
} from "@/lib/api/types";

export async function fetchAcademicOverview(): Promise<ApiResult<AcademicStructureOverviewDto>> {
  return bffFetch<AcademicStructureOverviewDto>("tenant/academic/overview");
}

export async function createAcademicYear(
  payload: CreateAcademicYearRequest,
  csrfToken: string,
): Promise<ApiResult<AcademicYearDto>> {
  return bffFetch<AcademicYearDto>("tenant/academic/years", {
    method: "POST",
    body: payload,
    csrfToken,
  });
}

export async function closeAcademicYear(
  academicYearId: string,
  csrfToken: string,
): Promise<ApiResult<void>> {
  return bffFetch<void>(`tenant/academic/years/${encodeURIComponent(academicYearId)}/close`, {
    method: "POST",
    csrfToken,
  });
}

export async function reopenAcademicYear(
  academicYearId: string,
  csrfToken: string,
): Promise<ApiResult<void>> {
  return bffFetch<void>(`tenant/academic/years/${encodeURIComponent(academicYearId)}/reopen`, {
    method: "POST",
    csrfToken,
  });
}

export async function createGradeLevel(
  payload: CreateGradeLevelRequest,
  csrfToken: string,
): Promise<ApiResult<GradeLevelDto>> {
  return bffFetch<GradeLevelDto>("tenant/academic/grade-levels", {
    method: "POST",
    body: payload,
    csrfToken,
  });
}

export async function createSchoolSection(
  payload: CreateSchoolSectionRequest,
  csrfToken: string,
): Promise<ApiResult<SchoolSectionDto>> {
  return bffFetch<SchoolSectionDto>("tenant/academic/sections", {
    method: "POST",
    body: payload,
    csrfToken,
  });
}

export async function createSubject(
  payload: CreateSubjectRequest,
  csrfToken: string,
): Promise<ApiResult<SubjectDto>> {
  return bffFetch<SubjectDto>("tenant/academic/subjects", {
    method: "POST",
    body: payload,
    csrfToken,
  });
}

export async function assignTeacher(
  payload: AssignTeacherRequest,
  csrfToken: string,
): Promise<ApiResult<TeacherAssignmentDto>> {
  return bffFetch<TeacherAssignmentDto>("tenant/academic/teacher-assignments", {
    method: "POST",
    body: payload,
    csrfToken,
  });
}
