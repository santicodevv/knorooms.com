import { z } from "zod";
import { isValidTenantSlug, RESERVED_SUBDOMAINS } from "@/lib/tenancy/host";

export const AVAILABLE_SUPPORT_PERMISSIONS = [
  {
    code: "institution.members.read",
    label: "Consultar miembros institucionales (institution.members.read)",
  },
  {
    code: "institution.roles.read",
    label: "Consultar catálogo de roles (institution.roles.read)",
  },
  {
    code: "institution.support-access.read",
    label: "Consultar auditoría de soporte (institution.support-access.read)",
  },
  {
    code: "institution.members.manage",
    label: "Gestionar miembros institucionales (institution.members.manage)",
  },
] as const;

export const createInstitutionSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "El nombre oficial debe contener al menos 3 caracteres.")
    .max(120, "El nombre no puede exceder 120 caracteres."),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .refine(
      (val) => !RESERVED_SUBDOMAINS.has(val),
      "Este subdominio está reservado por la plataforma.",
    )
    .refine(
      (val) => isValidTenantSlug(val),
      "El slug debe cumplir ^[a-z0-9](?:[a-z0-9-]{1,61}[a-z0-9])?$ (solo minúsculas, números y guiones internos).",
    ),
});

export type CreateInstitutionFormValues = z.infer<typeof createInstitutionSchema>;

export const assignAdminSchema = z.object({
  institutionId: z.string().trim().uuid("Seleccione una institución válida (UUID)."),
  email: z
    .string()
    .trim()
    .email("Ingrese un correo electrónico válido (ej. director@colegio-a.edu.do)."),
});

export type AssignAdminFormValues = z.infer<typeof assignAdminSchema>;

export const supportAccessRequestSchema = z.object({
  tenantId: z.string().trim().uuid("Seleccione la institución destino (UUID)."),
  reason: z
    .string()
    .trim()
    .min(10, "Describa el motivo técnico con al menos 10 caracteres para auditoría.")
    .max(500, "El motivo no puede exceder 500 caracteres."),
  permissions: z
    .array(z.string().min(1))
    .min(1, "Seleccione al menos un permiso requerido para la sesión de soporte."),
  durationMinutes: z.coerce
    .number()
    .int("La duración debe ser un número entero.")
    .min(15, "La duración mínima es de 15 minutos.")
    .max(1440, "La duración máxima permitida es de 1440 minutos (24 horas)."),
});

export type SupportAccessRequestFormValues = z.infer<typeof supportAccessRequestSchema>;
