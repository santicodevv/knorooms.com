export interface ProblemDetails {
  type?: string;
  title: string;
  status: number;
  detail?: string;
  traceId?: string;
  errors?: Record<string, string[]>;
}

export type InstitutionStatus = "Active" | "Suspended";

export type MembershipStatus = "Active" | "Revoked";

export interface MeMembershipSummaryDto {
  membershipId: string;
  tenantId: string;
  tenantSlug: string;
  tenantName: string;
  status: MembershipStatus;
}

export interface MeResponseDto {
  userId: string;
  displayName: string;
  email: string;
  platformRoles: string[];
  memberships: MeMembershipSummaryDto[];
}

export interface InstitutionDto {
  id: string;
  slug: string;
  name: string;
  status: InstitutionStatus;
  createdAt: string;
}

export interface CreateInstitutionRequest {
  slug: string;
  name: string;
}

export interface AssignAdministratorRequest {
  email: string;
}

export interface AssignAdministratorResponse {
  membershipId: string;
  userId?: string;
  email?: string;
  role?: string;
}

export type SupportAccessStatus = "Requested" | "Approved" | "Rejected" | "Revoked";
export type SupportGrantStatus = SupportAccessStatus;

export interface SupportAccessGrantDto {
  id: string;
  tenantId: string;
  requestedByUserId: string;
  reason: string;
  permissions: string[];
  durationMinutes: number;
  status: SupportAccessStatus;
  requestedAt: string;
  approvedAt: string | null;
  expiresAt: string | null;
  revokedAt: string | null;
}

export interface CreateSupportAccessRequest {
  tenantId: string;
  reason: string;
  permissions: string[];
  durationMinutes: number;
}

export type TenantAccessType = "Member" | "Support";

export interface TenantRoleSummaryDto {
  id: string;
  code: string;
  name: string;
}

export interface TenantContextDto {
  tenant: {
    id: string;
    slug: string;
    name: string;
    status: InstitutionStatus;
  };
  accessType: TenantAccessType;
  membershipId: string | null;
  roles: TenantRoleSummaryDto[];
  permissions: string[];
  supportAccessExpiresAt: string | null;
}

export interface MemberDto {
  membershipId: string;
  userId: string;
  displayName: string;
  email: string;
  status: MembershipStatus;
  roles: string[];
  createdAt: string;
}

export interface RoleDto {
  id: string;
  code: string;
  name: string;
  isSystem: boolean;
  permissions: string[];
}

export type EducationalStage = "EarlyChildhood" | "Primary" | "Secondary";

export type SchoolShift = "Morning" | "Afternoon" | "FullDay";

export interface AcademicYearDto {
  id: string;
  code: string;
  name: string;
  startDate: string;
  endDate: string;
  isClosed: boolean;
  sectionsCount: number;
  createdAtUtc: string;
}

export interface GradeLevelDto {
  id: string;
  stage: EducationalStage;
  officialGradeNumber: number;
  code: string;
  displayName: string;
  sectionsCount: number;
  createdAtUtc: string;
}

export interface SchoolSectionDto {
  id: string;
  academicYearId: string;
  academicYearCode: string;
  gradeLevelId: string;
  gradeLevelCode: string;
  gradeLevelName: string;
  code: string;
  shift: SchoolShift;
  capacity: number;
  assignedSubjectsCount: number;
  createdAtUtc: string;
}

export interface SubjectDto {
  id: string;
  code: string;
  name: string;
  assignedSectionsCount: number;
  createdAtUtc: string;
}

export interface TeacherAssignmentDto {
  id: string;
  academicYearId: string;
  academicYearCode: string;
  sectionId: string;
  sectionCode: string;
  gradeLevelName: string;
  subjectId: string;
  subjectCode: string;
  subjectName: string;
  teacherMembershipId: string;
  teacherDisplayName: string;
  teacherEmail: string;
  weeklyHours: number;
  createdAtUtc: string;
}

export interface AcademicStructureOverviewDto {
  academicYears: AcademicYearDto[];
  gradeLevels: GradeLevelDto[];
  sections: SchoolSectionDto[];
  subjects: SubjectDto[];
  teacherAssignments: TeacherAssignmentDto[];
}

export interface CreateAcademicYearRequest {
  code: string;
  name: string;
  startDate: string;
  endDate: string;
}

export interface CreateGradeLevelRequest {
  stage: EducationalStage;
  officialGradeNumber: number;
  code: string;
  displayName: string;
}

export interface CreateSchoolSectionRequest {
  academicYearId: string;
  gradeLevelId: string;
  code: string;
  shift: SchoolShift;
  capacity: number;
}

export interface CreateSubjectRequest {
  code: string;
  name: string;
}

export interface AssignTeacherRequest {
  sectionId: string;
  subjectId: string;
  teacherMembershipId: string;
  weeklyHours: number;
}

export type EnrollmentStatus = "Active" | "Transferred" | "Withdrawn" | "Promoted";

export interface StudentGuardianSummaryDto {
  linkId: string;
  guardianId: string;
  fullName: string;
  email: string;
  phoneNumber: string | null;
  relationshipType: string;
  hasAcademicAccess: boolean;
  hasFinancialResponsibility: boolean;
  hasPickupAuthorization: boolean;
}

export interface StudentEnrollmentSummaryDto {
  enrollmentId: string;
  academicYearId: string;
  academicYearCode: string;
  sectionId: string;
  sectionCode: string;
  gradeLevelCode: string;
  gradeLevelName: string;
  status: EnrollmentStatus;
}

export interface StudentDto {
  id: string;
  studentCode: string;
  firstName: string;
  lastName: string;
  fullName: string;
  birthDate: string;
  sigerdExternalId: string | null;
  isActive: boolean;
  guardians: StudentGuardianSummaryDto[];
  latestEnrollment: StudentEnrollmentSummaryDto | null;
  createdAtUtc: string;
}

export interface GuardianDto {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string | null;
  userAccountId: string | null;
  linkedStudentsCount: number;
  createdAtUtc: string;
}

export interface StudentDirectoryOverviewDto {
  students: StudentDto[];
  guardians: GuardianDto[];
}

export interface SectionCapacitySnapshotDto {
  sectionId: string;
  academicYearId: string;
  academicYearCode: string;
  isAcademicYearClosed: boolean;
  gradeLevelId: string;
  gradeLevelCode: string;
  gradeLevelName: string;
  sectionCode: string;
  shift: SchoolShift;
  capacity: number;
  activeEnrollmentsCount: number;
  availableSeats: number;
}

export interface StudentEnrollmentDto {
  id: string;
  studentId: string;
  studentCode: string;
  studentFullName: string;
  sigerdExternalId: string | null;
  academicYearId: string;
  academicYearCode: string;
  sectionId: string;
  sectionCode: string;
  gradeLevelCode: string;
  gradeLevelName: string;
  shift: SchoolShift;
  status: EnrollmentStatus;
  enrolledAtUtc: string;
}

export interface EnrollmentsOverviewDto {
  enrollments: StudentEnrollmentDto[];
  sectionCapacities: SectionCapacitySnapshotDto[];
}

export interface CreateStudentRequest {
  studentCode: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  sigerdExternalId?: string | null;
}

export interface CreateGuardianRequest {
  fullName: string;
  email: string;
  phoneNumber?: string | null;
}

export interface LinkStudentGuardianRequest {
  guardianId: string;
  relationshipType: string;
  hasAcademicAccess: boolean;
  hasFinancialResponsibility: boolean;
  hasPickupAuthorization: boolean;
}

export interface EnrollStudentRequest {
  studentId: string;
  sectionId: string;
}

export interface TransferStudentSectionRequest {
  targetSectionId: string;
}

export type AttendanceStatus = "Present" | "Absent" | "Late" | "Excused";
export type GradeWorkflowStatus = "Draft" | "Submitted" | "Approved" | "Published";

export interface AttendanceDailyMetricsDto {
  totalEnrolled: number;
  recordedCount: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  excusedCount: number;
  dailyAttendancePercentage: number;
}

export interface StudentAttendanceSummaryDto {
  totalDaysRecorded: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  excusedDays: number;
  cumulativeAttendancePercentage: number;
}

export interface SectionAttendanceRosterItemDto {
  enrollmentId: string;
  studentId: string;
  studentCode: string;
  studentFullName: string;
  nationalStudentId: string | null;
  attendanceRecordId: string | null;
  status: AttendanceStatus | null;
  justificationNote: string | null;
  recordedByMembershipId: string | null;
  recordedByDisplayName: string | null;
  updatedAtUtc: string | null;
  cumulativeSummary: StudentAttendanceSummaryDto;
}

export interface SectionAttendanceOverviewDto {
  selectedAcademicYearId: string | null;
  selectedAcademicYearName: string | null;
  selectedSectionId: string | null;
  selectedSectionLabel: string | null;
  selectedDate: string;
  metrics: AttendanceDailyMetricsDto;
  roster: SectionAttendanceRosterItemDto[];
}

export interface AttendanceEntryItemRequest {
  enrollmentId: string;
  status: AttendanceStatus;
  justificationNote?: string | null;
}

export interface RecordSectionAttendanceBatchRequest {
  sectionId: string;
  attendanceDate: string;
  entries: AttendanceEntryItemRequest[];
}

export interface AttendanceBatchRecordResultDto {
  sectionId: string;
  attendanceDate: string;
  processedCount: number;
  createdCount: number;
  updatedCount: number;
}

export interface EvaluationPolicyVersionDto {
  id: string;
  academicYearId: string;
  academicYearName: string;
  policyCode: string;
  versionNumber: number;
  name: string;
  rulesSpecificationJson: string;
  minPassingScore: number;
  enabledPeriods: string[];
  isValidatedWithPilotSchool: boolean;
  createdAtUtc: string;
}

export interface GradingMetricsDto {
  totalStudentsInSection: number;
  gradedStudentsCount: number;
  approvedEntriesCount: number;
  publishedEntriesCount: number;
  averageScore: number;
  passingStudentsCount: number;
  minPassingScore: number;
}

export interface StudentGradebookRowDto {
  enrollmentId: string;
  studentId: string;
  studentCode: string;
  studentFullName: string;
  gradeEntryId: string | null;
  numericScore: number | null;
  status: GradeWorkflowStatus | null;
  isPassing: boolean | null;
  recordedByMembershipId: string | null;
  recordedByDisplayName: string | null;
  approvedByMembershipId: string | null;
  approvedByDisplayName: string | null;
  correctionReason: string | null;
  updatedAtUtc: string | null;
  periodScores: Record<string, number>;
}

export interface GradingWorkspaceOverviewDto {
  selectedAcademicYearId: string | null;
  selectedAcademicYearName: string | null;
  selectedSectionId: string | null;
  selectedSectionLabel: string | null;
  selectedSubjectId: string | null;
  selectedSubjectName: string | null;
  selectedPeriodCode: string;
  policies: EvaluationPolicyVersionDto[];
  activePolicy: EvaluationPolicyVersionDto | null;
  metrics: GradingMetricsDto;
  gradebookRows: StudentGradebookRowDto[];
}

export interface CreateEvaluationPolicyRequest {
  academicYearId: string;
  policyCode: string;
  versionNumber: number;
  name: string;
  minPassingScore: number;
  enabledPeriods?: string[];
  notes?: string | null;
  isValidatedWithPilotSchool: boolean;
}

export interface StudentGradeItemRequest {
  enrollmentId: string;
  numericScore: number;
  correctionReason?: string | null;
}

export interface RecordSectionGradesBatchRequest {
  sectionId: string;
  subjectId: string;
  evaluationPolicyVersionId: string;
  periodCode: string;
  grades: StudentGradeItemRequest[];
}

export interface GradesBatchRecordResultDto {
  sectionId: string;
  subjectId: string;
  periodCode: string;
  processedCount: number;
  createdCount: number;
  updatedCount: number;
}

export interface GradeEntryDto {
  id: string;
  enrollmentId: string;
  subjectId: string;
  evaluationPolicyVersionId: string;
  periodCode: string;
  numericScore: number;
  status: GradeWorkflowStatus;
  recordedByMembershipId: string;
  approvedByMembershipId: string | null;
  correctionReason: string | null;
  updatedAtUtc: string;
}

export interface StudentReportCardReadinessDto {
  enrollmentId: string;
  studentId: string;
  studentCode: string;
  studentFullName: string;
  nationalStudentId: string | null;
  recordedSubjectsCount: number;
  totalGradeSubjectsCount: number;
  periodAverageScore: number | null;
  latestPublishedVersion: number;
  latestSnapshotId: string | null;
  latestPublishedAtUtc: string | null;
}

export interface ReportCardSnapshotDto {
  id: string;
  enrollmentId: string;
  studentId: string;
  studentCode: string;
  studentFullName: string;
  gradeAndSectionLabel: string;
  academicYearName: string;
  evaluationPolicyVersionId: string;
  evaluationPolicyName: string;
  periodCode: string;
  versionNumber: number;
  immutablePayloadJson: string;
  publishedByMembershipId: string;
  publishedByDisplayName: string;
  publishedAtUtc: string;
  supersedesSnapshotId: string | null;
  correctionReason: string | null;
}

export interface ReportCardsOverviewDto {
  selectedAcademicYearId: string | null;
  selectedAcademicYearName: string | null;
  selectedSectionId: string | null;
  selectedSectionLabel: string | null;
  selectedPeriodCode: string;
  activeEvaluationPolicyVersionId: string | null;
  activeEvaluationPolicyName: string | null;
  studentReadiness: StudentReportCardReadinessDto[];
  snapshots: ReportCardSnapshotDto[];
}

export interface PublishReportCardRequest {
  enrollmentId: string;
  evaluationPolicyVersionId: string;
  periodCode: string;
  correctionReason?: string | null;
}

export type ApiResult<T> =
  | {
      ok: true;
      status: number;
      data: T;
    }
  | {
      ok: false;
      status: number;
      problem: ProblemDetails;
    };
