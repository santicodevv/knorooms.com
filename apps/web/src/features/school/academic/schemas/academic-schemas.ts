import { z } from "zod";
import type { EducationalStage, SchoolShift } from "@/lib/api/types";

export const EDUCATIONAL_STAGE_OPTIONS: Array<{
  value: EducationalStage;
  label: string;
  shortLabel: string;
  minerdNote: string;
}> = [
  {
    value: "EarlyChildhood",
    label: "Nivel Inicial",
    shortLabel: "Inicial",
    minerdNote: "Pre-Kínder, Kínder y Pre-Primario",
  },
  {
    value: "Primary",
    label: "Nivel Primario",
    shortLabel: "Primaria",
    minerdNote: "1.º a 6.º de Primaria (Ciclos I y II)",
  },
  {
    value: "Secondary",
    label: "Nivel Secundario",
    shortLabel: "Secundaria",
    minerdNote: "1.º a 6.º de Secundaria (Académica / Técnico-Profesional)",
  },
];

export const SCHOOL_SHIFT_OPTIONS: Array<{
  value: SchoolShift;
  label: string;
  shortLabel: string;
  scheduleHint: string;
}> = [
  {
    value: "Morning",
    label: "Tanda Matutina",
    shortLabel: "Matutina",
    scheduleHint: "07:30 – 12:45",
  },
  {
    value: "Afternoon",
    label: "Tanda Vespertina",
    shortLabel: "Vespertina",
    scheduleHint: "13:30 – 18:00",
  },
  {
    value: "FullDay",
    label: "Jornada Escolar Extendida",
    shortLabel: "Jornada Extendida",
    scheduleHint: "08:00 – 16:00",
  },
];

export function getEducationalStageMeta(stage: EducationalStage) {
  return (
    EDUCATIONAL_STAGE_OPTIONS.find((item) => item.value === stage) ?? {
      value: stage,
      label: stage,
      shortLabel: stage,
      minerdNote: "",
    }
  );
}

export function getSchoolShiftMeta(shift: SchoolShift) {
  return (
    SCHOOL_SHIFT_OPTIONS.find((item) => item.value === shift) ?? {
      value: shift,
      label: shift,
      shortLabel: shift,
      scheduleHint: "",
    }
  );
}

export function calculateAcademicYearProgress(
  startDateIso: string,
  endDateIso: string,
  referenceDate: Date = new Date(),
): number {
  const startMs = Date.parse(`${startDateIso}T00:00:00Z`);
  const endMs = Date.parse(`${endDateIso}T23:59:59Z`);
  const nowMs = referenceDate.getTime();

  if (Number.isNaN(startMs) || Number.isNaN(endMs) || endMs <= startMs) {
    return 0;
  }

  if (nowMs <= startMs) {
    return 0;
  }

  if (nowMs >= endMs) {
    return 100;
  }

  const ratio = ((nowMs - startMs) / (endMs - startMs)) * 100;
  return Math.max(0, Math.min(100, Math.round(ratio)));
}

export function getInitials(displayName: string): string {
  const parts = displayName
    .trim()
    .split(/\s+/)
    .filter((part) => part.length > 0);
  if (parts.length === 0) {
    return "DO";
  }
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export const createAcademicYearSchema = z
  .object({
    code: z
      .string()
      .trim()
      .min(4, "El código es obligatorio (ej. 2026-2027).")
      .max(32, "Máximo 32 caracteres."),
    name: z
      .string()
      .trim()
      .min(3, "El nombre descriptivo es obligatorio.")
      .max(120, "Máximo 120 caracteres."),
    startDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Indique una fecha de inicio válida (AAAA-MM-DD)."),
    endDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Indique una fecha de cierre válida (AAAA-MM-DD)."),
  })
  .refine((values) => values.endDate > values.startDate, {
    message: "La fecha de cierre debe ser posterior a la fecha de inicio.",
    path: ["endDate"],
  });

export type CreateAcademicYearFormValues = z.infer<typeof createAcademicYearSchema>;

export const createGradeLevelSchema = z.object({
  stage: z.enum(["EarlyChildhood", "Primary", "Secondary"], {
    message: "Seleccione un nivel educativo oficial.",
  }),
  officialGradeNumber: z.number().int().min(1, "Mínimo grado 1.").max(12, "Máximo grado 12."),
  code: z
    .string()
    .trim()
    .min(1, "El código del grado es obligatorio (ej. P1, S4).")
    .max(32, "Máximo 32 caracteres."),
  displayName: z
    .string()
    .trim()
    .min(3, "El nombre oficial del grado es obligatorio (ej. 4.º de Secundaria).")
    .max(120, "Máximo 120 caracteres."),
});

export type CreateGradeLevelFormValues = z.infer<typeof createGradeLevelSchema>;

export const createSchoolSectionSchema = z.object({
  academicYearId: z.string().uuid("Seleccione un año escolar válido."),
  gradeLevelId: z.string().uuid("Seleccione un grado académico válido."),
  code: z
    .string()
    .trim()
    .min(1, "El identificador de sección es obligatorio (ej. A, B, 01).")
    .max(16, "Máximo 16 caracteres."),
  shift: z.enum(["Morning", "Afternoon", "FullDay"], {
    message: "Seleccione una tanda escolar.",
  }),
  capacity: z
    .number()
    .int()
    .min(1, "La capacidad mínima es 1 estudiante.")
    .max(120, "La capacidad máxima por aula es 120 estudiantes."),
});

export type CreateSchoolSectionFormValues = z.infer<typeof createSchoolSectionSchema>;

export const createSubjectSchema = z.object({
  code: z
    .string()
    .trim()
    .min(2, "El código curricular es obligatorio (ej. MAT-S4).")
    .max(32, "Máximo 32 caracteres."),
  name: z
    .string()
    .trim()
    .min(3, "El nombre de la asignatura es obligatorio.")
    .max(120, "Máximo 120 caracteres."),
});

export type CreateSubjectFormValues = z.infer<typeof createSubjectSchema>;

export const assignTeacherSchema = z.object({
  sectionId: z.string().uuid("Seleccione una sección activa."),
  subjectId: z.string().uuid("Seleccione una asignatura del catálogo."),
  teacherMembershipId: z.string().uuid("Seleccione un docente miembro de la institución."),
  weeklyHours: z
    .number()
    .int()
    .min(1, "Mínimo 1 hora pedagógica semanal.")
    .max(40, "Máximo 40 horas pedagógicas semanales."),
});

export type AssignTeacherFormValues = z.infer<typeof assignTeacherSchema>;
