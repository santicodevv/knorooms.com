import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import type { EnrollmentRecord, EnrollmentSection, EnrollmentStudent } from "./enrollment-types";
import {
  deriveEnrollmentYears,
  enrollmentStudentLabel,
  selectAvailableEnrollmentSections,
  selectEligibleEnrollmentStudents,
  selectEnrollmentSections,
  selectSectionEnrollments,
} from "./enrollment-selectors";

const yearA = randomUUID(),
  yearB = randomUUID();
function section(overrides: Partial<EnrollmentSection> = {}): EnrollmentSection {
  return {
    sectionId: randomUUID(),
    academicYearId: yearA,
    academicYearCode: "QA-A",
    isAcademicYearClosed: false,
    gradeLevelName: "Primero de prueba",
    sectionCode: "A",
    shift: "Morning",
    capacity: 20,
    activeEnrollmentsCount: 0,
    availableSeats: 20,
    ...overrides,
  };
}
function student(overrides: Partial<EnrollmentStudent> = {}): EnrollmentStudent {
  return {
    id: randomUUID(),
    studentCode: "QA-" + randomUUID().slice(0, 8),
    fullName: "José de prueba",
    sigerdExternalId: null,
    isActive: true,
    ...overrides,
  };
}
function record(
  person: EnrollmentStudent,
  overrides: Partial<EnrollmentRecord> = {},
): EnrollmentRecord {
  return {
    id: randomUUID(),
    studentId: person.id,
    studentCode: person.studentCode,
    studentFullName: person.fullName,
    academicYearId: yearA,
    sectionId: randomUUID(),
    status: "Active",
    enrolledAtUtc: "2026-11-25T00:00:00Z",
    ...overrides,
  };
}

describe("elegibilidad y selección de matrículas", () => {
  it("usa el catálogo de años disponible incluso si está vacío", () => {
    const sections = [section()];
    expect(deriveEnrollmentYears([], sections)).toEqual([]);
    const years = [{ id: yearB, code: "QA-B", isClosed: true }];
    expect(deriveEnrollmentYears(years, sections)).toEqual(years);
  });

  it("si no hay permiso académico deriva años sólo desde metadatos reales y sin duplicarlos", () => {
    const sections = [
      section(),
      section(),
      section({ academicYearId: yearB, academicYearCode: "QA-B", isAcademicYearClosed: true }),
    ];
    expect(deriveEnrollmentYears(null, sections)).toEqual([
      { id: yearA, code: "QA-A", isClosed: false },
      { id: yearB, code: "QA-B", isClosed: true },
    ]);
    expect(deriveEnrollmentYears(null, [])).toEqual([]);
  });

  it("filtra secciones por año y sólo ofrece matrícula con cupo y año abierto", () => {
    const available = section();
    const full = section({ availableSeats: 0, activeEnrollmentsCount: 20 });
    const closed = section({ isAcademicYearClosed: true });
    const otherYear = section({ academicYearId: yearB });
    const sections = [available, full, closed, otherYear];
    expect(selectEnrollmentSections(sections, yearA)).toEqual([available, full, closed]);
    expect(selectAvailableEnrollmentSections(sections, yearA)).toEqual([available]);
    expect(selectAvailableEnrollmentSections(sections, "")).toEqual([]);
  });

  it.each(["Active", "Transferred", "Withdrawn", "Promoted"] as const)(
    "excluye una matrícula del mismo año aunque su estado sea %s",
    (status) => {
      const enrolled = student(),
        eligible = student();
      expect(
        selectEligibleEnrollmentStudents(
          [enrolled, eligible],
          [record(enrolled, { status })],
          yearA,
        ),
      ).toEqual([eligible]);
    },
  );

  it("no excluye estudiantes por una matrícula de otro año y sí excluye expedientes inactivos", () => {
    const otherYear = student(),
      inactive = student({ isActive: false });
    expect(
      selectEligibleEnrollmentStudents(
        [otherYear, inactive],
        [record(otherYear, { academicYearId: yearB })],
        yearA,
      ),
    ).toEqual([otherYear]);
    expect(selectEligibleEnrollmentStudents([otherYear], [], "")).toEqual([]);
  });

  it("el listado de una sección muestra sólo matrículas activas de esa sección", () => {
    const target = randomUUID(),
      person = student();
    const active = record(person, { sectionId: target });
    const withdrawn = record(person, { sectionId: target, status: "Withdrawn" });
    const foreignSection = record(person);
    expect(selectSectionEnrollments([active, withdrawn, foreignSection], target, "")).toEqual([
      active,
    ]);
  });

  it("busca nombre y código sin perder acentos o distinguir mayúsculas", () => {
    const person = student({ studentCode: "QA-CODE" }),
      target = randomUUID();
    const enrollment = record(person, { sectionId: target });
    expect(selectSectionEnrollments([enrollment], target, "  JOSE ")).toEqual([enrollment]);
    expect(selectSectionEnrollments([enrollment], target, "qa-code")).toEqual([enrollment]);
    expect(selectSectionEnrollments([enrollment], target, "ausente")).toEqual([]);
  });

  it("etiqueta estudiantes con datos reales sin insertar identificadores ausentes", () => {
    const person = student();
    expect(enrollmentStudentLabel(person)).toBe(`${person.fullName} · ${person.studentCode}`);
    expect(enrollmentStudentLabel({ ...person, sigerdExternalId: "QA-EXT" })).toBe(
      `${person.fullName} · ${person.studentCode} · QA-EXT`,
    );
  });
});
