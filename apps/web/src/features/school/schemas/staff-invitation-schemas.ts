import { z } from "zod";

export const staffInvitationSchema = z.object({
  email: z
    .email("Introduce un correo electrónico válido.")
    .max(254, "El correo es demasiado largo."),
  roleIds: z.array(z.uuid()).min(1, "Selecciona al menos un rol."),
});

export type StaffInvitationFormValues = z.infer<typeof staffInvitationSchema>;
