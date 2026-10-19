import { describe, expect, it } from "vitest";
import {
  calculateSectionOccupancyPercent,
  calculateStudentAge,
  createGuardianSchema,
  createStudentSchema,
  enrollStudentSchema,
  getEnrollmentStatusMeta,
  linkStudentGuardianSchema,
  transferStudentSectionSchema,
} from "./students-schemas";

describe("students-schemas", () => {
  it("calculates student age accurately from birth date", () => {
    expect(calculateStudentAge("2016-05-15", new Date("2026-06-01T00:00:00Z"))).toBe(10);
    expect(calculateStudentAge("2016-05-15", new Date("2026-05-10T00:00:00Z"))).toBe(9);
  });

  it("calculates classroom section occupancy percentage", () => {
    expect(calculateSectionOccupancyPercent(0, 30)).toBe(0);
    expect(calculateSectionOccupancyPercent(15, 30)).toBe(50);
    expect(calculateSectionOccupancyPercent(35, 30)).toBe(100);
  });

  it("maps enrollment status metadata in Spanish", () => {
    expect(getEnrollmentStatusMeta("Active").shortLabel).toBe("Activo");
    expect(getEnrollmentStatusMeta("Withdrawn").shortLabel).toBe("Retirado");
  });

  it("validates student, guardian, link, and enrollment forms", () => {
    expect(
      createStudentSchema.safeParse({
        studentCode: "EST-2026-001",
        firstName: "Camila",
        lastName: "Rodríguez",
        birthDate: "2016-05-14",
        sigerdExternalId: "SIGERD-99001",
      }).success,
    ).toBe(true);

    expect(
      createGuardianSchema.safeParse({
        fullName: "Laura Ureña",
        email: "laura@familia.do",
        phoneNumber: "809-555-0192",
      }).success,
    ).toBe(true);

    expect(
      linkStudentGuardianSchema.safeParse({
        guardianId: "0195b3c4-1111-7000-8000-000000000001",
        relationshipType: "Madre",
        hasAcademicAccess: true,
        hasFinancialResponsibility: true,
        hasPickupAuthorization: true,
      }).success,
    ).toBe(true);

    expect(
      enrollStudentSchema.safeParse({
        studentId: "0195b3c4-1111-7000-8000-000000000002",
        sectionId: "0195b3c4-1111-7000-8000-000000000003",
      }).success,
    ).toBe(true);

    expect(
      transferStudentSectionSchema.safeParse({
        targetSectionId: "0195b3c4-1111-7000-8000-000000000004",
      }).success,
    ).toBe(true);
  });
});
