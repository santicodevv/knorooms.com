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
