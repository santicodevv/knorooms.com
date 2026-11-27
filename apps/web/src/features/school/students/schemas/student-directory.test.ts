import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import type { GuardianDto, StudentDto } from "@/lib/api/types";
import {
  filterGuardians,
  filterStudents,
  linkedGuardianStudents,
  paginateRecords,
} from "./student-directory";

function student(overrides: Partial<StudentDto> = {}): StudentDto {
  return {
    id: randomUUID(),
    studentCode: randomUUID().slice(0, 8),
    firstName: "Nombre",
    lastName: "Apellido",
    fullName: "Nombre Apellido",
    birthDate: "2015-01-01",
    sigerdExternalId: null,
    isActive: true,
    guardians: [],
    latestEnrollment: null,
    createdAtUtc: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}
function guardian(overrides: Partial<GuardianDto> = {}): GuardianDto {
  return {
    id: randomUUID(),
    fullName: "Responsable de prueba",
    email: `${randomUUID()}@example.invalid`,
    phoneNumber: null,
    userAccountId: null,
    linkedStudentsCount: 0,
    createdAtUtc: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("filtros reales del directorio escolar", () => {
  it("busca sin distinguir acentos, mayúsculas ni espacios exteriores", () => {
    const target = student({
      fullName: "Ángela Nuñez",
      studentCode: "QA-UNO",
      sigerdExternalId: "EXT-ABC",
    });
    const other = student({ fullName: "Otro estudiante" });
    expect(filterStudents([target, other], "  ANGELA  ", "all")).toEqual([target]);
    expect(filterStudents([target, other], "qa-uno", "all")).toEqual([target]);
    expect(filterStudents([target, other], "ext-abc", "all")).toEqual([target]);
    expect(filterStudents([target, other], "sin coincidencias", "all")).toEqual([]);
  });

  it("combina la consulta con el estado del expediente", () => {
    const active = student({ fullName: "Nombre común" });
    const inactive = student({ fullName: "Nombre común", isActive: false });
    expect(filterStudents([active, inactive], "común", "active")).toEqual([active]);
    expect(filterStudents([active, inactive], "común", "inactive")).toEqual([inactive]);
    expect(filterStudents([active, inactive], "", "all")).toEqual([active, inactive]);
  });

  it("no confunde una matrícula retirada con una matrícula activa al filtrar pendientes", () => {
    const latest = {
      enrollmentId: randomUUID(),
      academicYearId: randomUUID(),
      academicYearCode: "QA-YEAR",
      sectionId: randomUUID(),
      sectionCode: "QA",
      gradeLevelCode: "QA-GRADE",
      gradeLevelName: "Grado QA",
      status: "Active" as const,
    };
    const enrolled = student({ latestEnrollment: latest });
    const withdrawn = student({ latestEnrollment: { ...latest, status: "Withdrawn" } });
    const pending = student();
    expect(filterStudents([enrolled, withdrawn, pending], "", "unassigned")).toEqual([
      withdrawn,
      pending,
    ]);
  });

  it("filtra responsables por nombre y correo sin fabricar vínculos", () => {
    const target = guardian({ fullName: "María Responsable", email: "familia-qa@example.invalid" });
    const other = guardian();
    expect(filterGuardians([target, other], "MARIA")).toEqual([target]);
    expect(filterGuardians([target, other], "FAMILIA-QA@")).toEqual([target]);
    expect(filterGuardians([target, other], "sin coincidencias")).toEqual([]);
  });

  it("solo incluye expedientes que declaran el vínculo con ese responsable", () => {
    const target = guardian();
    const linked = student({
      guardians: [
        {
          linkId: randomUUID(),
          guardianId: target.id,
          fullName: target.fullName,
          email: target.email,
          phoneNumber: null,
          relationshipType: "Tutor legal",
          hasAcademicAccess: false,
          hasFinancialResponsibility: false,
          hasPickupAuthorization: false,
        },
      ],
    });
    const other = student();
    expect(linkedGuardianStudents([linked, other], target.id)).toEqual([linked]);
    expect(linkedGuardianStudents([linked, other], randomUUID())).toEqual([]);
  });
});

describe("paginación del directorio", () => {
  it("conserva el orden de los registros y no duplica filas entre páginas", () => {
    const rows = Array.from({ length: 23 }, () => randomUUID());
    const first = paginateRecords(rows, 1);
    const second = paginateRecords(rows, 2);
    const third = paginateRecords(rows, 3);
    expect([...first.rows, ...second.rows, ...third.rows]).toEqual(rows);
    expect(first).toMatchObject({ page: 1, pages: 3, total: 23 });
    expect(third.rows).toHaveLength(3);
  });

  it("ajusta una página que dejó de existir tras cambiar los filtros", () => {
    const rows = [randomUUID(), randomUUID()];
    expect(paginateRecords(rows, 20)).toMatchObject({ rows, page: 1, pages: 1, total: 2 });
    expect(paginateRecords([], 20)).toMatchObject({ rows: [], page: 1, pages: 1, total: 0 });
  });

  it("normaliza páginas y tamaños no finitos o fuera de rango", () => {
    const rows = Array.from({ length: 12 }, () => randomUUID());
    expect(paginateRecords(rows, NaN).page).toBe(1);
    expect(paginateRecords(rows, -4).page).toBe(1);
    expect(paginateRecords(rows, 1, 0).rows).toHaveLength(1);
    expect(paginateRecords(rows, 1, Infinity).rows).toHaveLength(10);
  });
});
