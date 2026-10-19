import { bffFetch } from "@/lib/api/bff-client";
import type { ApiResult, MemberDto, SupportAccessGrantDto } from "@/lib/api/types";

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
