import { bffFetch } from "@/lib/api/bff-client";
import type { InstitutionDto } from "@/lib/api/types";
import {
  directoryQuery,
  type DirectoryFilters,
  type InstitutionPage,
  type ModuleSettings,
  type ProvisionValues,
} from "../schemas/institution-management-schemas";
const base = "platform/institution-management";
export const listInstitutionDirectory = (filters: DirectoryFilters) =>
  bffFetch<InstitutionPage>(`${base}?${directoryQuery(filters)}`);
export const provisionInstitution = (body: ProvisionValues, csrfToken: string) =>
  bffFetch<InstitutionDto>(base, { method: "POST", body, csrfToken });
export const checkInstitutionSlug = (slug: string) =>
  bffFetch<{ available: boolean }>(`${base}/slug-availability?slug=${encodeURIComponent(slug)}`);
export const getInstitutionModules = (id: string) =>
  bffFetch<ModuleSettings>(`${base}/${id}/modules`);
export const updateInstitutionModules = (
  id: string,
  enabledModules: string[],
  version: number | null,
  csrfToken: string,
) =>
  bffFetch<ModuleSettings>(`${base}/${id}/modules`, {
    method: "PUT",
    body: { enabledModules, version },
    csrfToken,
  });
export const resendAdministratorInvitation = (
  id: string,
  invitationId: string,
  csrfToken: string,
) =>
  bffFetch(`platform/institutions/${id}/invitations/${invitationId}/resend`, {
    method: "POST",
    csrfToken,
  });
