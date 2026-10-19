import { describe, expect, it } from "vitest";
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
