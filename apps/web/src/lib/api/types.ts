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
