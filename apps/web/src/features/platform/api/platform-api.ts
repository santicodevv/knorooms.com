import { bffFetch } from "@/lib/api/bff-client";
import type {
  ApiResult,
  AssignAdministratorResponse,
  CreateInstitutionRequest,
  CreateSupportAccessRequest,
  InstitutionDto,
  SupportAccessGrantDto,
} from "@/lib/api/types";

export async function fetchPlatformInstitutions(): Promise<ApiResult<InstitutionDto[]>> {
  return bffFetch<InstitutionDto[]>("platform/institutions");
}

export async function createPlatformInstitution(
  payload: CreateInstitutionRequest,
  csrfToken: string,
): Promise<ApiResult<InstitutionDto>> {
  return bffFetch<InstitutionDto>("platform/institutions", {
    method: "POST",
    body: payload,
    csrfToken,
  });
}

export async function togglePlatformInstitutionStatus(
  institutionId: string,
  action: "suspend" | "activate",
  csrfToken: string,
): Promise<ApiResult<void>> {
  return bffFetch<void>(`platform/institutions/${encodeURIComponent(institutionId)}/${action}`, {
    method: "POST",
    csrfToken,
  });
}

export async function assignPlatformInitialAdministrator(
  institutionId: string,
  email: string,
  csrfToken: string,
): Promise<ApiResult<AssignAdministratorResponse>> {
  return bffFetch<AssignAdministratorResponse>(
    `platform/institutions/${encodeURIComponent(institutionId)}/administrators`,
    {
      method: "POST",
      body: { email },
      csrfToken,
    },
  );
}

export async function requestPlatformSupportAccess(
  payload: CreateSupportAccessRequest,
  csrfToken: string,
): Promise<ApiResult<SupportAccessGrantDto>> {
  return bffFetch<SupportAccessGrantDto>("platform/support-access-requests", {
    method: "POST",
    body: payload,
    csrfToken,
  });
}
