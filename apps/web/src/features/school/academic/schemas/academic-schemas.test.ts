import { describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import {
  assignTeacherSchema,
  calculateAcademicYearProgress,
  createAcademicYearSchema,
  createGradeLevelSchema,
  createSchoolSectionSchema,
  createSubjectSchema,
  getInitials,
} from "./academic-schemas";

describe("academic-schemas", () => {
  it("calculates academic year timeline progress accurately", () => {
    const start = "2026-08-01";
    const end = "2027-06-01";

    expect(calculateAcademicYearProgress(start, end, new Date("2026-07-15T12:00:00Z"))).toBe(0);
    expect(calculateAcademicYearProgress(start, end, new Date("2027-07-01T12:00:00Z"))).toBe(100);

    const mid = calculateAcademicYearProgress(start, end, new Date("2027-01-01T00:00:00Z"));
    expect(mid).toBeGreaterThan(45);
    expect(mid).toBeLessThan(55);
  });

  it("extracts teacher avatar initials cleanly", () => {
    expect(getInitials("María Fernanda Gómez")).toBe("MG");
    expect(getInitials("Profesor")).toBe("PR");
    expect(getInitials("   ")).toBe("DO");
  });

  it("validates academic year date ordering", () => {
    const invalid = createAcademicYearSchema.safeParse({
      code: "2026-2027",
      name: "Año Escolar 2026-2027",
      startDate: "2027-06-25",
      endDate: "2026-08-24",
    });
    expect(invalid.success).toBe(false);

    const valid = createAcademicYearSchema.safeParse({
      code: "2026-2027",
      name: "Año Escolar 2026-2027",
      startDate: "2026-08-24",
      endDate: "2027-06-25",
    });
    expect(valid.success).toBe(true);
  });

  it("validates MINERD grade levels, sections, subjects, and teacher assignments", () => {
    expect(
      createGradeLevelSchema.safeParse({
        stage: "Secondary",
        officialGradeNumber: 10,
        code: "S4",
        displayName: "4.º de Secundaria",
      }).success,
    ).toBe(true);

    expect(
      createSchoolSectionSchema.safeParse({
        academicYearId: "0195b3c4-1111-7000-8000-000000000001",
        gradeLevelId: "0195b3c4-1111-7000-8000-000000000002",
        code: "A",
        shift: "Morning",
        capacity: 32,
      }).success,
    ).toBe(true);

    expect(
      createSubjectSchema.safeParse({
        code: "MAT-S4",
        name: "Matemáticas y Geometría",
      }).success,
    ).toBe(true);

    expect(
      assignTeacherSchema.safeParse({
        sectionId: "0195b3c4-1111-7000-8000-000000000003",
        subjectId: "0195b3c4-1111-7000-8000-000000000004",
        teacherMembershipId: "0195b3c4-1111-7000-8000-000000000005",
        weeklyHours: 6,
      }).success,
    ).toBe(true);
  });
});

describe("límites de los formularios académicos", () => {
  const year = {
    code: "QA-2026",
    name: "Año de prueba",
    startDate: "2026-08-01",
    endDate: "2027-06-30",
  };
  const grade = {
    stage: "Primary",
    officialGradeNumber: 1,
    code: "QA-P1",
    displayName: "Primero de prueba",
  };
  const section = {
    academicYearId: randomUUID(),
    gradeLevelId: randomUUID(),
    code: "QA-A",
    shift: "Morning",
    capacity: 20,
  };
  const assignment = {
    sectionId: randomUUID(),
    subjectId: randomUUID(),
    teacherMembershipId: randomUUID(),
    weeklyHours: 4,
  };

  it("rechaza campos vacíos y fechas iguales en el año escolar", () => {
    expect(createAcademicYearSchema.safeParse({ ...year, code: "   ", name: "  " }).success).toBe(
      false,
    );
    const result = createAcademicYearSchema.safeParse({ ...year, endDate: year.startDate });
    expect(result.success).toBe(false);
    if (!result.success)
      expect(result.error.issues.some((issue) => issue.path[0] === "endDate")).toBe(true);
  });

  it.each(["2026-02-31", "2026-13-01", "2025-02-29"])(
    "rechaza fechas inexistentes del calendario: %s",
    (startDate) => {
      expect(createAcademicYearSchema.safeParse({ ...year, startDate }).success).toBe(false);
    },
  );

  it("acepta el día bisiesto válido sin confundirlo con una fecha inexistente", () => {
    expect(
      createAcademicYearSchema.safeParse({
        ...year,
        startDate: "2024-02-29",
        endDate: "2025-01-01",
      }).success,
    ).toBe(true);
  });

  it("recorta los nombres y códigos antes de enviarlos", () => {
    const parsed = createAcademicYearSchema.parse({
      ...year,
      code: "  " + year.code + "  ",
      name: "  " + year.name + "  ",
    });
    expect(parsed.code).toBe(year.code);
    expect(parsed.name).toBe(year.name);
    expect(createSubjectSchema.parse({ code: "  QA-MAT ", name: " Materia de prueba  " })).toEqual({
      code: "QA-MAT",
      name: "Materia de prueba",
    });
  });

  it.each([0, 13, 1.5])(
    "rechaza el número de grado fuera del contrato: %s",
    (officialGradeNumber) => {
      expect(createGradeLevelSchema.safeParse({ ...grade, officialGradeNumber }).success).toBe(
        false,
      );
    },
  );

  it("acepta extremos del contrato sin inventar fórmulas escolares", () => {
    expect(createGradeLevelSchema.safeParse({ ...grade, officialGradeNumber: 12 }).success).toBe(
      true,
    );
    expect(createSchoolSectionSchema.safeParse({ ...section, capacity: 1 }).success).toBe(true);
    expect(createSchoolSectionSchema.safeParse({ ...section, capacity: 120 }).success).toBe(true);
    expect(assignTeacherSchema.safeParse({ ...assignment, weeklyHours: 1 }).success).toBe(true);
    expect(assignTeacherSchema.safeParse({ ...assignment, weeklyHours: 40 }).success).toBe(true);
  });

  it.each([0, 121, 4.5])("rechaza capacidad inválida: %s", (capacity) => {
    expect(createSchoolSectionSchema.safeParse({ ...section, capacity }).success).toBe(false);
  });

  it.each([0, 41, 2.5])("rechaza horas semanales inválidas: %s", (weeklyHours) => {
    expect(assignTeacherSchema.safeParse({ ...assignment, weeklyHours }).success).toBe(false);
  });

  it("exige referencias válidas y conserva las tandas del contrato", () => {
    expect(
      createSchoolSectionSchema.safeParse({ ...section, academicYearId: "", gradeLevelId: "" })
        .success,
    ).toBe(false);
    expect(assignTeacherSchema.safeParse({ ...assignment, teacherMembershipId: "" }).success).toBe(
      false,
    );
    expect(createSchoolSectionSchema.safeParse({ ...section, shift: "Night" }).success).toBe(false);
    expect(createGradeLevelSchema.safeParse({ ...grade, stage: "University" }).success).toBe(false);
  });
});
