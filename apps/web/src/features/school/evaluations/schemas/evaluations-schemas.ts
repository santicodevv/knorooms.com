import { z } from "zod";
import type { AttendanceStatus } from "@/lib/api/types";

export const ATTENDANCE_STATUS_OPTIONS: readonly {
  value: AttendanceStatus;
  label: string;
  shortLabel: string;
}[] = [
  { value: "Present", label: "Presente", shortLabel: "P" },
  { value: "Late", label: "Tardanza", shortLabel: "T" },
  { value: "Excused", label: "Excusado", shortLabel: "E" },
  { value: "Absent", label: "Ausente", shortLabel: "A" },
] as const;

export const EVALUATION_PERIOD_OPTIONS = [
  { code: "P1", label: "Período 1 (P1)" },
  { code: "P2", label: "Período 2 (P2)" },
  { code: "P3", label: "Período 3 (P3)" },
  { code: "P4", label: "Período 4 (P4)" },
  { code: "FINAL", label: "Cierre Final" },
] as const;

export const createEvaluationPolicySchema = z.object({
  academicYearId: z.string().uuid("Selecciona un año escolar válido."),
  policyCode: z
    .string()
    .trim()
    .min(2, "El código de la política debe tener al menos 2 caracteres.")
    .max(64, "El código no puede exceder 64 caracteres.")
    .regex(
      /^[A-Za-z0-9_-]+$/,
      "Usa únicamente letras, números, guiones o guiones bajos (ej. MINERD-SEC-ORD22).",
    ),
  versionNumber: z
    .number({ message: "Ingresa un número de versión válido." })
    .int("La versión debe ser un número entero.")
    .min(1, "La versión mínima es 1.")
    .max(99, "La versión máxima es 99."),
  name: z
    .string()
    .trim()
    .min(3, "El nombre descriptivo debe tener al menos 3 caracteres.")
    .max(160, "El nombre no puede exceder 160 caracteres."),
  minPassingScore: z
    .number({ message: "Ingresa la calificación mínima aprobatoria." })
    .min(1, "El mínimo aprobatorio debe ser al menos 1.")
    .max(100, "El mínimo aprobatorio no puede superar 100."),
  notes: z
    .string()
    .trim()
    .max(300, "Las notas normativas no pueden superar 300 caracteres.")
    .optional()
    .or(z.literal("")),
  isValidatedWithPilotSchool: z.boolean(),
});

export type CreateEvaluationPolicyFormValues = z.infer<typeof createEvaluationPolicySchema>;

export const publishReportCardSchema = z
  .object({
    enrollmentId: z.string().uuid("Selecciona una matrícula estudiantil válida."),
    evaluationPolicyVersionId: z.string().uuid("Selecciona una política de evaluación vigente."),
    periodCode: z.string().trim().min(1, "Selecciona el período de evaluación.").max(16),
    isRectification: z.boolean(),
    correctionReason: z
      .string()
      .trim()
      .max(400, "El motivo no puede exceder 400 caracteres.")
      .optional()
      .or(z.literal("")),
  })
  .superRefine((values, ctx) => {
    if (
      values.isRectification &&
      (!values.correctionReason || values.correctionReason.trim().length < 10)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["correctionReason"],
        message:
          "Toda rectificación de un boletín ya publicado exige un motivo auditable de al menos 10 caracteres.",
      });
    }
  });

export type PublishReportCardFormValues = z.infer<typeof publishReportCardSchema>;

export interface ParsedReportCardSubjectItem {
  subjectId: string;
  subjectCode: string;
  subjectName: string;
  numericScore: number;
  isPassing: boolean;
  workflowStatus: string;
}

export interface ParsedReportCardAttendance {
  totalDaysRecorded: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  excusedDays: number;
  attendancePercentage: number;
}

export interface ParsedReportCardPayload {
  institutionName: string;
  academicYearName: string;
  periodCode: string;
  studentCode: string;
  studentFullName: string;
  nationalStudentId: string | null;
  gradeName: string;
  sectionName: string;
  policyCode: string;
  policyVersion: number;
  policyName: string;
  minPassingScore: number;
  averageScore: number;
  academicStanding: string;
  subjects: ParsedReportCardSubjectItem[];
  attendance: ParsedReportCardAttendance;
  generatedAtUtc: string | null;
}

export function parseReportCardPayload(rawJson: string): ParsedReportCardPayload | null {
  try {
    const parsed = JSON.parse(rawJson) as Record<string, unknown>;
    if (!parsed || typeof parsed !== "object") {
      return null;
    }

    const rawSubjects = Array.isArray(parsed.Subjects ?? parsed.subjects)
      ? ((parsed.Subjects ?? parsed.subjects) as Record<string, unknown>[])
      : [];

    const subjects: ParsedReportCardSubjectItem[] = rawSubjects.map((item) => ({
      subjectId: String(item.SubjectId ?? item.subjectId ?? ""),
      subjectCode: String(item.SubjectCode ?? item.subjectCode ?? "ASIG"),
      subjectName: String(item.SubjectName ?? item.subjectName ?? "Asignatura"),
      numericScore: Number(item.NumericScore ?? item.numericScore ?? 0),
      isPassing: Boolean(item.IsPassing ?? item.isPassing ?? false),
      workflowStatus: String(item.WorkflowStatus ?? item.workflowStatus ?? "Published"),
    }));

    const rawAtt = (parsed.Attendance ?? parsed.attendance ?? {}) as Record<string, unknown>;

    return {
      institutionName: String(
        parsed.InstitutionName ?? parsed.institutionName ?? "Institución Educativa",
      ),
      academicYearName: String(parsed.AcademicYearName ?? parsed.academicYearName ?? "Año Escolar"),
      periodCode: String(parsed.PeriodCode ?? parsed.periodCode ?? "P1"),
      studentCode: String(parsed.StudentCode ?? parsed.studentCode ?? "N/D"),
      studentFullName: String(parsed.StudentFullName ?? parsed.studentFullName ?? "Estudiante"),
      nationalStudentId:
        typeof (parsed.NationalStudentId ?? parsed.nationalStudentId) === "string"
          ? String(parsed.NationalStudentId ?? parsed.nationalStudentId)
          : null,
      gradeName: String(parsed.GradeName ?? parsed.gradeName ?? "Grado"),
      sectionName: String(parsed.SectionName ?? parsed.sectionName ?? "A"),
      policyCode: String(parsed.PolicyCode ?? parsed.policyCode ?? "MINERD"),
      policyVersion: Number(parsed.PolicyVersion ?? parsed.policyVersion ?? 1),
      policyName: String(parsed.PolicyName ?? parsed.policyName ?? "Política Institucional"),
      minPassingScore: Number(parsed.MinPassingScore ?? parsed.minPassingScore ?? 70),
      averageScore: Number(parsed.AverageScore ?? parsed.averageScore ?? 0),
      academicStanding: String(
        parsed.AcademicStanding ?? parsed.academicStanding ?? "En Evaluación",
      ),
      subjects,
      attendance: {
        totalDaysRecorded: Number(rawAtt.TotalDaysRecorded ?? rawAtt.totalDaysRecorded ?? 0),
        presentDays: Number(rawAtt.PresentDays ?? rawAtt.presentDays ?? 0),
        absentDays: Number(rawAtt.AbsentDays ?? rawAtt.absentDays ?? 0),
        lateDays: Number(rawAtt.LateDays ?? rawAtt.lateDays ?? 0),
        excusedDays: Number(rawAtt.ExcusedDays ?? rawAtt.excusedDays ?? 0),
        attendancePercentage: Number(
          rawAtt.AttendancePercentage ?? rawAtt.attendancePercentage ?? 100,
        ),
      },
      generatedAtUtc:
        typeof (parsed.GeneratedAtUtc ?? parsed.generatedAtUtc) === "string"
          ? String(parsed.GeneratedAtUtc ?? parsed.generatedAtUtc)
          : null,
    };
  } catch {
    return null;
  }
}
