import { describe, expect, it } from "vitest";
import {
  createEvaluationPolicySchema,
  parseReportCardPayload,
  publishReportCardSchema,
} from "./evaluations-schemas";

describe("evaluations-schemas", () => {
  it("valida correctamente una política de evaluación institucional", () => {
    const valid = createEvaluationPolicySchema.safeParse({
      academicYearId: "0195b3c4-1111-7000-8000-000000000001",
      policyCode: "MINERD-SEC-ORD22",
      versionNumber: 1,
      name: "Ordenanza 22-2017 Secundaria",
      minPassingScore: 70,
      notes: "Escala 0-100 con 4 períodos parciales",
      isValidatedWithPilotSchool: true,
    });

    expect(valid.success).toBe(true);
  });

  it("exige motivo de rectificación de al menos 10 caracteres al corregir un boletín ya publicado", () => {
    const invalidRectification = publishReportCardSchema.safeParse({
      enrollmentId: "0195b3c4-1111-7000-8000-000000000002",
      evaluationPolicyVersionId: "0195b3c4-1111-7000-8000-000000000003",
      periodCode: "P1",
      isRectification: true,
      correctionReason: "corto",
    });

    expect(invalidRectification.success).toBe(false);

    const validRectification = publishReportCardSchema.safeParse({
      enrollmentId: "0195b3c4-1111-7000-8000-000000000002",
      evaluationPolicyVersionId: "0195b3c4-1111-7000-8000-000000000003",
      periodCode: "P1",
      isRectification: true,
      correctionReason: "Rectificación aprobada por consejo técnico #402",
    });

    expect(validRectification.success).toBe(true);
  });

  it("parsea la instantánea JSON inmutable de un boletín oficial", () => {
    const payload = parseReportCardPayload(
      JSON.stringify({
        InstitutionName: "Colegio Quisqueya RD",
        AcademicYearName: "Año Escolar 2026-2027",
        PeriodCode: "P1",
        StudentCode: "EST-2026-001",
        StudentFullName: "Camila Rodríguez Ureña",
        NationalStudentId: "SIGERD-99001",
        GradeName: "4.º de Secundaria",
        SectionName: "A",
        PolicyCode: "MINERD-SEC-ORD22",
        PolicyVersion: 1,
        PolicyName: "Ordenanza 22-2017",
        MinPassingScore: 70,
        AverageScore: 91.5,
        AcademicStanding: "Aprobado",
        Subjects: [
          {
            SubjectId: "0195b3c4-1111-7000-8000-000000000010",
            SubjectCode: "MAT-S4",
            SubjectName: "Matemáticas",
            NumericScore: 91.5,
            IsPassing: true,
            WorkflowStatus: "Published",
          },
        ],
        Attendance: {
          TotalDaysRecorded: 20,
          PresentDays: 19,
          AbsentDays: 0,
          LateDays: 1,
          ExcusedDays: 0,
          AttendancePercentage: 100,
        },
      }),
    );

    expect(payload).not.toBeNull();
    expect(payload?.studentFullName).toBe("Camila Rodríguez Ureña");
    expect(payload?.averageScore).toBe(91.5);
    expect(payload?.subjects).toHaveLength(1);
    expect(payload?.attendance.presentDays).toBe(19);
  });
});
