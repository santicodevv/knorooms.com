import { schoolViewKey, getSchoolCapabilities } from "./school-context";
import { headers } from "next/headers";
import { SchoolShell } from "@/components/school/school-shell";
import { EvaluationsWorkspace } from "@/features/school/evaluations/components/evaluations-workspace";
import { serverApiFetch } from "@/lib/api/server-api";
import type {
  AcademicStructureOverviewDto,
  GradingWorkspaceOverviewDto,
  ReportCardsOverviewDto,
  SectionAttendanceOverviewDto,
  TenantContextDto,
} from "@/lib/api/types";
import { getServerSession } from "@/lib/auth/session-store";
import { resolveHost } from "@/lib/tenancy/host";

const EMPTY_ACADEMIC: AcademicStructureOverviewDto = {
  academicYears: [],
  gradeLevels: [],
  sections: [],
  subjects: [],
  teacherAssignments: [],
};

const EMPTY_ATTENDANCE: SectionAttendanceOverviewDto = {
  selectedAcademicYearId: null,
  selectedAcademicYearName: null,
  selectedSectionId: null,
  selectedSectionLabel: null,
  selectedDate: new Date().toISOString().slice(0, 10),
  metrics: {
    totalEnrolled: 0,
    recordedCount: 0,
    presentCount: 0,
    absentCount: 0,
    lateCount: 0,
    excusedCount: 0,
    dailyAttendancePercentage: 0,
  },
  roster: [],
};

const EMPTY_GRADING: GradingWorkspaceOverviewDto = {
  selectedAcademicYearId: null,
  selectedAcademicYearName: null,
  selectedSectionId: null,
  selectedSectionLabel: null,
  selectedSubjectId: null,
  selectedSubjectName: null,
  selectedPeriodCode: "P1",
  policies: [],
  activePolicy: null,
  metrics: {
    totalStudentsInSection: 0,
    gradedStudentsCount: 0,
    approvedEntriesCount: 0,
    publishedEntriesCount: 0,
    averageScore: 0,
    passingStudentsCount: 0,
    minPassingScore: 70,
  },
  gradebookRows: [],
};

const EMPTY_REPORT_CARDS: ReportCardsOverviewDto = {
  selectedAcademicYearId: null,
  selectedAcademicYearName: null,
  selectedSectionId: null,
  selectedSectionLabel: null,
  selectedPeriodCode: "P1",
  activeEvaluationPolicyVersionId: null,
  activeEvaluationPolicyName: null,
  studentReadiness: [],
  snapshots: [],
};

export async function SchoolEvaluationsPage({ path = [] }: { path?: string[] } = {}) {
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

  const capabilities = session && contextResult?.ok ? await getSchoolCapabilities() : null;
  const writable = (code: string) =>
    Boolean(
      capabilities?.ok && capabilities.data.modules.some((m) => m.code === code && m.canWrite),
    );
  const permissions = contextResult?.ok ? contextResult.data.permissions : [];

  const canReadAcademic = permissions.includes("institution.academic.read");
  const canReadAttendance = permissions.includes("institution.attendance.read");
  const canRecordAttendance =
    permissions.includes("institution.attendance.record") && writable("attendance");
  const canReadGrades = permissions.includes("institution.grading.read");
  const canRecordGrades = permissions.includes("institution.grading.record") && writable("grading");
  const canApproveGrades =
    permissions.includes("institution.grading.approve") && writable("grading");
  const canReadReportCards = permissions.includes("institution.report-cards.read");
  const canPublishReportCards =
    permissions.includes("institution.report-cards.publish") && writable("reportcards");

  const [academicRes, attendanceRes, gradingRes, reportCardsRes] =
    session && contextResult?.ok
      ? await Promise.all([
          canReadAcademic
            ? serverApiFetch<AcademicStructureOverviewDto>("/api/tenant/academic/overview")
            : Promise.resolve(null),
          canReadAttendance && path[0] === "attendance"
            ? serverApiFetch<SectionAttendanceOverviewDto>("/api/tenant/attendance")
            : Promise.resolve(null),
          canReadGrades && ["grading", "settings"].includes(path[0])
            ? serverApiFetch<GradingWorkspaceOverviewDto>("/api/tenant/grading")
            : Promise.resolve(null),
          canReadReportCards && path[0] === "report-cards"
            ? serverApiFetch<ReportCardsOverviewDto>("/api/tenant/report-cards")
            : Promise.resolve(null),
        ])
      : [null, null, null, null];

  const initialProblem =
    (attendanceRes && !attendanceRes.ok ? attendanceRes.problem : null) ??
    (gradingRes && !gradingRes.ok ? gradingRes.problem : null) ??
    (reportCardsRes && !reportCardsRes.ok ? reportCardsRes.problem : null);

  return (
    <SchoolShell
      session={session}
      rawHost={rawHost}
      slug={slug}
      returnTo={"/" + path.join("/")}
      activeTab={
        path[0] === "grading"
          ? "grading"
          : path[0] === "report-cards"
            ? "report-cards"
            : path[0] === "settings"
              ? "settings"
              : "attendance"
      }
      contextResult={contextResult}
    >
      {session && contextResult?.ok ? (
        <EvaluationsWorkspace
          key={schoolViewKey(
            path,
            academicRes?.ok ? academicRes.data : null,
            gradingRes?.ok ? gradingRes.data : null,
            attendanceRes?.ok ? attendanceRes.data : null,
            reportCardsRes?.ok ? reportCardsRes.data : null,
          )}
          path={path}
          initialAcademicOverview={academicRes?.ok ? academicRes.data : EMPTY_ACADEMIC}
          initialAttendance={attendanceRes?.ok ? attendanceRes.data : EMPTY_ATTENDANCE}
          initialGrading={gradingRes?.ok ? gradingRes.data : EMPTY_GRADING}
          initialReportCards={reportCardsRes?.ok ? reportCardsRes.data : EMPTY_REPORT_CARDS}
          initialProblem={initialProblem}
          csrfToken={session.csrfToken}
          canRecordAttendance={canRecordAttendance}
          canRecordGrades={canRecordGrades}
          canApproveGrades={canApproveGrades}
          canPublishReportCards={canPublishReportCards}
        />
      ) : null}
    </SchoolShell>
  );
}
