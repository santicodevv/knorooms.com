import { z } from "zod";
import type { EnrollmentStatus } from "@/lib/api/types";

export const GUARDIAN_RELATIONSHIP_SUGGESTIONS = [
  "Madre",
  "Padre",
  "Tutor Legal",
  "Abuela / Abuelo",
  "Tía / Tío",
  "Hermana / Hermano Mayor",
] as const;

export function calculateStudentAge(
  birthDateIso: string,
  referenceDate: Date = new Date(),
): number {
  const parts = birthDateIso.split("-").map(Number);
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) {
    return 0;
  }

  const [birthYear, birthMonth, birthDay] = parts;
  let age = referenceDate.getUTCFullYear() - birthYear;
  const currentMonth = referenceDate.getUTCMonth() + 1;
  const currentDay = referenceDate.getUTCDate();

  if (currentMonth < birthMonth || (currentMonth === birthMonth && currentDay < birthDay)) {
    age -= 1;
  }

  return Math.max(0, age);
}

export function calculateSectionOccupancyPercent(
  activeEnrollments: number,
  capacity: number,
): number {
  if (capacity <= 0 || activeEnrollments <= 0) {
    return 0;
  }
  return Math.min(100, Math.round((activeEnrollments / capacity) * 100));
}

export function getEnrollmentStatusMeta(status: EnrollmentStatus) {
  switch (status) {
    case "Active":
      return {
        label: "Matriculado Activo",
        shortLabel: "Activo",
        badgeClass: "border-emerald-200 bg-emerald-50 text-emerald-800",
        dotClass: "bg-emerald-500",
      };
    case "Withdrawn":
      return {
        label: "Matrícula Retirada",
        shortLabel: "Retirado",
        badgeClass: "border-rose-200 bg-rose-50 text-rose-800",
        dotClass: "bg-rose-500",
      };
    case "Transferred":
      return {
        label: "Trasladado",
        shortLabel: "Trasladado",
        badgeClass: "border-amber-200 bg-amber-50 text-amber-800",
        dotClass: "bg-amber-500",
      };
    case "Promoted":
      return {
        label: "Promovido",
        shortLabel: "Promovido",
        badgeClass: "border-sky-200 bg-sky-50 text-sky-800",
        dotClass: "bg-sky-500",
      };
  }
}

export const createStudentSchema = z.object({
  studentCode: z
    .string()
    .trim()
    .min(3, "El código de expediente es obligatorio (ej. EST-2026-001).")
    .max(32, "Máximo 32 caracteres."),
  firstName: z
    .string()
    .trim()
    .min(2, "Los nombres del estudiante son obligatorios.")
    .max(100, "Máximo 100 caracteres."),
  lastName: z
    .string()
    .trim()
    .min(2, "Los apellidos del estudiante son obligatorios.")
    .max(100, "Máximo 100 caracteres."),
  birthDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Indique una fecha de nacimiento válida (AAAA-MM-DD)."),
  sigerdExternalId: z.string().trim().max(64, "Máximo 64 caracteres.").optional(),
});

export type CreateStudentFormValues = z.infer<typeof createStudentSchema>;

export const createGuardianSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(3, "El nombre completo del responsable familiar es obligatorio.")
    .max(160, "Máximo 160 caracteres."),
  email: z
    .string()
    .trim()
    .email("Indique un correo electrónico válido.")
    .max(254, "Máximo 254 caracteres."),
  phoneNumber: z.string().trim().max(32, "Máximo 32 caracteres.").optional(),
});

export type CreateGuardianFormValues = z.infer<typeof createGuardianSchema>;

export const linkStudentGuardianSchema = z.object({
  guardianId: z.string().uuid("Seleccione un responsable familiar registrado."),
  relationshipType: z
    .string()
    .trim()
    .min(2, "Indique el parentesco o vínculo familiar (ej. Madre, Padre).")
    .max(64, "Máximo 64 caracteres."),
  hasAcademicAccess: z.boolean(),
  hasFinancialResponsibility: z.boolean(),
  hasPickupAuthorization: z.boolean(),
});

export type LinkStudentGuardianFormValues = z.infer<typeof linkStudentGuardianSchema>;

export const enrollStudentSchema = z.object({
  studentId: z.string().uuid("Seleccione un expediente estudiantil activo."),
  sectionId: z.string().uuid("Seleccione una sección con cupos disponibles."),
});

export type EnrollStudentFormValues = z.infer<typeof enrollStudentSchema>;

export const transferStudentSectionSchema = z.object({
  targetSectionId: z.string().uuid("Seleccione la sección de destino para el traslado."),
});

export type TransferStudentSectionFormValues = z.infer<typeof transferStudentSectionSchema>;
