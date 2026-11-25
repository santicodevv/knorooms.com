import { randomUUID } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
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

describe("validaciones de alta y acciones del expediente", () => {
  const student = () => ({
    studentCode: "QA-" + randomUUID().slice(0, 8),
    firstName: "Nombre de prueba",
    lastName: "Apellido de prueba",
    birthDate: "2014-02-28",
    sigerdExternalId: "",
  });

  it("normaliza espacios sin modificar códigos ni nombres válidos", () => {
    const value = student();
    const result = createStudentSchema.parse({
      ...value,
      studentCode: ` ${value.studentCode} `,
      firstName: ` ${value.firstName} `,
      lastName: ` ${value.lastName} `,
    });
    expect(result).toEqual(value);
  });

  it.each(["studentCode", "firstName", "lastName", "birthDate"] as const)(
    "asocia el error del campo requerido %s a su ruta",
    (field) => {
      const result = createStudentSchema.safeParse({ ...student(), [field]: "" });
      expect(result.success).toBe(false);
      if (!result.success)
        expect(result.error.issues.some((issue) => issue.path[0] === field)).toBe(true);
    },
  );

  it("rechaza entradas que superan el tamaño admitido por el contrato", () => {
    expect(
      createStudentSchema.safeParse({ ...student(), studentCode: "X".repeat(33) }).success,
    ).toBe(false);
    expect(
      createStudentSchema.safeParse({ ...student(), firstName: "X".repeat(101) }).success,
    ).toBe(false);
    expect(
      createStudentSchema.safeParse({ ...student(), sigerdExternalId: "X".repeat(65) }).success,
    ).toBe(false);
  });

  it("permite registrar un responsable sin teléfono y valida su correo", () => {
    const guardian = { fullName: "Responsable de prueba", email: "qa@example.invalid" };
    expect(createGuardianSchema.safeParse(guardian).success).toBe(true);
    const invalid = createGuardianSchema.safeParse({ ...guardian, email: "correo-inválido" });
    expect(invalid.success).toBe(false);
    if (!invalid.success) expect(invalid.error.issues[0].path).toEqual(["email"]);
  });

  it("exige seleccionar un responsable y no concede autorizaciones omitidas", () => {
    const link = {
      guardianId: randomUUID(),
      relationshipType: "Tutor legal",
      hasAcademicAccess: false,
      hasFinancialResponsibility: false,
      hasPickupAuthorization: false,
    };
    expect(linkStudentGuardianSchema.parse(link)).toEqual(link);
    expect(linkStudentGuardianSchema.safeParse({ ...link, guardianId: "" }).success).toBe(false);
    expect(
      linkStudentGuardianSchema.safeParse({ ...link, hasPickupAuthorization: undefined }).success,
    ).toBe(false);
  });

  it("exige identificadores de registros existentes para matrícula y traslado", () => {
    expect(enrollStudentSchema.safeParse({ studentId: randomUUID(), sectionId: "" }).success).toBe(
      false,
    );
    expect(transferStudentSectionSchema.safeParse({ targetSectionId: "" }).success).toBe(false);
  });

  it.each(["2015-02-29", "2016-02-30", "2026-13-01", "1994-12-31", "2026-11-25"])(
    "rechaza una fecha imposible o fuera del contrato: %s",
    (birthDate) => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-11-24T23:59:59Z"));
      try {
        const result = createStudentSchema.safeParse({ ...student(), birthDate });
        expect(result.success).toBe(false);
        if (!result.success)
          expect(result.error.issues.some((issue) => issue.path[0] === "birthDate")).toBe(true);
      } finally {
        vi.useRealTimers();
      }
    },
  );

  it("acepta el día actual UTC, el límite inferior y un día bisiesto real", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-24T00:01:00Z"));
    try {
      for (const birthDate of ["2026-11-24", "1995-01-01", "2016-02-29"]) {
        expect(createStudentSchema.safeParse({ ...student(), birthDate }).success).toBe(true);
      }
    } finally {
      vi.useRealTimers();
    }
  });
});
