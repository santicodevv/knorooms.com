import { bffFetch } from "@/lib/api/bff-client";
import type {
  InstitutionSetup,
  InstitutionProfile,
  InstitutionProfileValues,
  AdministratorInvitation,
} from "../schemas/institution-setup-schemas";
const base = (id: string) => `platform/institutions/${encodeURIComponent(id)}`;
export const getInstitutionSetup = (id: string) => bffFetch<InstitutionSetup>(`${base(id)}/setup`);
export const updateInstitutionProfile = (
  id: string,
  body: InstitutionProfileValues,
  csrfToken: string,
) => bffFetch<InstitutionProfile>(`${base(id)}/profile`, { method: "PUT", body, csrfToken });
export const inviteAdministrator = (id: string, email: string, csrfToken: string) =>
  bffFetch<AdministratorInvitation>(`${base(id)}/invitations`, {
    method: "POST",
    body: { email },
    csrfToken,
  });
export const revokeAdministratorInvitation = (
  id: string,
  invitationId: string,
  csrfToken: string,
) =>
  bffFetch(`${base(id)}/invitations/${encodeURIComponent(invitationId)}/revoke`, {
    method: "POST",
    csrfToken,
  });
