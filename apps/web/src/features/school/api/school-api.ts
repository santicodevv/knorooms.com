import { bffFetch } from "@/lib/api/bff-client";
import type {
  ApiResult,
  CreateInstitutionStaffInvitationRequest,
  InstitutionStaffInvitationDto,
  MemberDto,
  RoleDto,
  SupportAccessGrantDto,
} from "@/lib/api/types";

export type SupportGrantAction = "approve" | "reject" | "revoke";

export async function fetchSchoolMembers(): Promise<ApiResult<MemberDto[]>> {
  return bffFetch<MemberDto[]>("tenant/members");
}

export async function revokeSchoolMember(
  membershipId: string,
  csrfToken: string,
): Promise<ApiResult<void>> {
  return bffFetch<void>(`tenant/members/${encodeURIComponent(membershipId)}/revoke`, {
    method: "POST",
    csrfToken,
  });
}

export async function fetchSchoolSupportAccessGrants(): Promise<
  ApiResult<SupportAccessGrantDto[]>
> {
  return bffFetch<SupportAccessGrantDto[]>("tenant/support-access");
}

export async function executeSchoolSupportGrantAction(
  grantId: string,
  action: SupportGrantAction,
  csrfToken: string,
): Promise<ApiResult<void>> {
  return bffFetch<void>(`tenant/support-access/${encodeURIComponent(grantId)}/${action}`, {
    method: "POST",
    csrfToken,
  });
}

export async function fetchSchoolRoles(): Promise<ApiResult<RoleDto[]>> {
  return bffFetch<RoleDto[]>("tenant/roles");
}

export async function fetchStaffInvitations(): Promise<ApiResult<InstitutionStaffInvitationDto[]>> {
  return bffFetch<InstitutionStaffInvitationDto[]>("tenant/staff-invitations");
}

export async function createStaffInvitation(
  payload: CreateInstitutionStaffInvitationRequest,
  csrfToken: string,
): Promise<ApiResult<InstitutionStaffInvitationDto>> {
  return bffFetch<InstitutionStaffInvitationDto>("tenant/staff-invitations", {
    method: "POST",
    body: payload,
    csrfToken,
  });
}

export async function resendStaffInvitation(
  id: string,
  csrfToken: string,
): Promise<ApiResult<void>> {
  return bffFetch<void>(`tenant/staff-invitations/${encodeURIComponent(id)}/resend`, {
    method: "POST",
    csrfToken,
  });
}

export async function revokeStaffInvitation(
  id: string,
  csrfToken: string,
): Promise<ApiResult<void>> {
  return bffFetch<void>(`tenant/staff-invitations/${encodeURIComponent(id)}/revoke`, {
    method: "POST",
    csrfToken,
  });
}
