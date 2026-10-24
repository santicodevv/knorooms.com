import { z } from "zod";
export const institutionProfileSchema = z.object({
  name: z.string().trim().min(3, "Escriba al menos 3 caracteres.").max(160),
  contactName: z.string().trim().max(160),
  contactEmail: z.union([
    z.literal(""),
    z.string().trim().email("Indique un correo válido.").max(320),
  ]),
  phone: z.string().trim().max(40),
  address: z.string().trim().max(500),
  centerCode: z.string().trim().max(50),
  logoUrl: z.union([
    z.literal(""),
    z.string().url("Indique una dirección válida.").startsWith("https://", "Use HTTPS.").max(1000),
  ]),
  timeZoneId: z.string().min(1).max(64),
  onboardingOwner: z.string().trim().max(160),
  welcomeMeetingCompleted: z.boolean(),
  onboardingNotes: z.string().trim().max(2000),
  version: z.number(),
});
export type InstitutionProfileValues = z.infer<typeof institutionProfileSchema>;
export interface InstitutionProfile extends InstitutionProfileValues {
  id: string;
  slug: string;
  status: "Active" | "Suspended";
}
export interface AdministratorInvitation {
  id: string;
  email: string;
  status: string;
  deliveryStatus: string;
  expiresAt: string;
  acceptedAt: string | null;
}
export interface InstitutionSetup {
  profile: InstitutionProfile;
  administrators: { userId: string; displayName: string; email: string }[];
  invitations: AdministratorInvitation[];
  tasks: { code: string; label: string; completed: boolean }[];
  progressPercent: number;
}
export const invitationEmailSchema = z.object({
  email: z.string().trim().email("Indique un correo válido.").max(320),
});
export const invitationStatusLabels: Record<string, string> = {
  Pending: "Pendiente",
  Accepted: "Aceptada",
  Revoked: "Revocada",
  Expired: "Vencida",
  Queued: "En cola",
  Sent: "Enviada",
  Failed: "Error de envío",
};
