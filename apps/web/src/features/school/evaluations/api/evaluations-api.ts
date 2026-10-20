import { bffFetch } from "@/lib/api/bff-client";
import type {
  ApiResult,
  AttendanceBatchRecordResultDto,
  CreateEvaluationPolicyRequest,
  EvaluationPolicyVersionDto,
  GradeEntryDto,
  GradesBatchRecordResultDto,
  GradingWorkspaceOverviewDto,
  PublishReportCardRequest,
  RecordSectionAttendanceBatchRequest,
  RecordSectionGradesBatchRequest,
  ReportCardSnapshotDto,
  ReportCardsOverviewDto,
  SectionAttendanceOverviewDto,
} from "@/lib/api/types";

export async function getSectionAttendanceOverview(params?: {
  academicYearId?: string;
  sectionId?: string;
  attendanceDate?: string;
}): Promise<ApiResult<SectionAttendanceOverviewDto>> {
  const search = new URLSearchParams();
  if (params?.academicYearId) search.set("academicYearId", params.academicYearId);
  if (params?.sectionId) search.set("sectionId", params.sectionId);
  if (params?.attendanceDate) search.set("attendanceDate", params.attendanceDate);

  const query = search.toString();
  return bffFetch<SectionAttendanceOverviewDto>(`tenant/attendance${query ? `?${query}` : ""}`);
}

export async function recordSectionAttendanceBatch(
  payload: RecordSectionAttendanceBatchRequest,
  csrfToken: string,
): Promise<ApiResult<AttendanceBatchRecordResultDto>> {
  return bffFetch<AttendanceBatchRecordResultDto>("tenant/attendance/batch", {
    method: "POST",
    body: payload,
    csrfToken,
  });
}

export async function getGradingWorkspaceOverview(params?: {
  academicYearId?: string;
  sectionId?: string;
  subjectId?: string;
  periodCode?: string;
}): Promise<ApiResult<GradingWorkspaceOverviewDto>> {
  const search = new URLSearchParams();
  if (params?.academicYearId) search.set("academicYearId", params.academicYearId);
  if (params?.sectionId) search.set("sectionId", params.sectionId);
  if (params?.subjectId) search.set("subjectId", params.subjectId);
  if (params?.periodCode) search.set("periodCode", params.periodCode);

  const query = search.toString();
  return bffFetch<GradingWorkspaceOverviewDto>(`tenant/grading${query ? `?${query}` : ""}`);
}

export async function createEvaluationPolicy(
  payload: CreateEvaluationPolicyRequest,
  csrfToken: string,
): Promise<ApiResult<EvaluationPolicyVersionDto>> {
  return bffFetch<EvaluationPolicyVersionDto>("tenant/grading/policies", {
    method: "POST",
    body: payload,
    csrfToken,
  });
}

export async function recordSectionGradesBatch(
  payload: RecordSectionGradesBatchRequest,
  csrfToken: string,
): Promise<ApiResult<GradesBatchRecordResultDto>> {
  return bffFetch<GradesBatchRecordResultDto>("tenant/grading/entries/batch", {
    method: "POST",
    body: payload,
    csrfToken,
  });
}

export async function approveGradeEntry(
  gradeEntryId: string,
  csrfToken: string,
): Promise<ApiResult<GradeEntryDto>> {
  return bffFetch<GradeEntryDto>(
    `tenant/grading/entries/${encodeURIComponent(gradeEntryId)}/approve`,
    {
      method: "POST",
      csrfToken,
    },
  );
}

export async function getReportCardsOverview(params?: {
  academicYearId?: string;
  sectionId?: string;
  periodCode?: string;
}): Promise<ApiResult<ReportCardsOverviewDto>> {
  const search = new URLSearchParams();
  if (params?.academicYearId) search.set("academicYearId", params.academicYearId);
  if (params?.sectionId) search.set("sectionId", params.sectionId);
  if (params?.periodCode) search.set("periodCode", params.periodCode);

  const query = search.toString();
  return bffFetch<ReportCardsOverviewDto>(`tenant/report-cards${query ? `?${query}` : ""}`);
}

export async function publishReportCard(
  payload: PublishReportCardRequest,
  csrfToken: string,
): Promise<ApiResult<ReportCardSnapshotDto>> {
  return bffFetch<ReportCardSnapshotDto>("tenant/report-cards/publish", {
    method: "POST",
    body: payload,
    csrfToken,
  });
}
