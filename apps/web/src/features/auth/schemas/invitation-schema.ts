import { z } from "zod";
export const acceptInvitationSchema = z.object({
  invitationId: z.string().uuid(),
  token: z.string().regex(/^[A-Fa-f0-9]{64}$/),
  displayName: z.string().trim().min(2, "Indique su nombre.").max(160),
  password: z.string().min(1, "Indique su contraseña.").max(128),
});
export type AcceptInvitationValues = z.infer<typeof acceptInvitationSchema>;
