import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import type { SchoolSectionDto, SubjectDto, TeacherAssignmentDto } from "@/lib/api/types";
import {
  filterAcademicSubjects,
  groupTeacherAssignments,
  selectAcademicSections,
} from "./academic-view";

function assignment(overrides: Partial<TeacherAssignmentDto> = {}): TeacherAssignmentDto {
  return {
    id: randomUUID(),
    academicYearId: randomUUID(),
    academicYearCode: "QA-YEAR",
    sectionId: randomUUID(),
    sectionCode: "A",
    gradeLevelName: "Grado de prueba",
    subjectId: randomUUID(),
    subjectCode: "QA-SUBJECT",
    subjectName: "Materia de prueba",
    teacherMembershipId: randomUUID(),
    teacherDisplayName: "Persona de prueba",
    teacherEmail: "qa@example.invalid",
    weeklyHours: 4,
    createdAtUtc: "2026-08-01T00:00:00Z",
    ...overrides,
  };
}
function section(yearId: string, gradeId: string): SchoolSectionDto {
  return {
    id: randomUUID(),
    academicYearId: yearId,
    academicYearCode: "QA-YEAR",
    gradeLevelId: gradeId,
    gradeLevelCode: "QA-GRADE",
    gradeLevelName: "Grado de prueba",
    code: "A",
    shift: "Morning",
    capacity: 20,
    assignedSubjectsCount: 0,
    createdAtUtc: "2026-08-01T00:00:00Z",
  };
}
describe("selección y agrupación académica con registros reales", () => {
  it("agrupa por membresía sin mezclar docentes homónimos", () => {
    const first = assignment();
    const otherMembership = assignment({ teacherDisplayName: first.teacherDisplayName });
    const second = assignment({
      teacherMembershipId: first.teacherMembershipId,
      teacherDisplayName: first.teacherDisplayName,
      weeklyHours: 6,
    });
    const groups = groupTeacherAssignments([first, otherMembership, second]);
    expect(groups).toHaveLength(2);
    expect(
      groups.find((item) => item.teacherMembershipId === first.teacherMembershipId),
    ).toMatchObject({ assignments: [first, second], weeklyHours: 10 });
    expect(
      groups.find((item) => item.teacherMembershipId === otherMembership.teacherMembershipId)
        ?.assignments,
    ).toEqual([otherMembership]);
  });

  it("conserva cada asignación y sus horas sin inventar historial ni duplicar registros", () => {
    const first = assignment();
    const second = assignment({
      teacherMembershipId: first.teacherMembershipId,
      sectionId: first.sectionId,
      weeklyHours: 2,
    });
    const input = Object.freeze([Object.freeze(first), Object.freeze(second)]);
    const groups = groupTeacherAssignments(input);
    expect(groups.flatMap((group) => group.assignments).map((item) => item.id)).toEqual([
      first.id,
      second.id,
    ]);
    expect(groups[0].weeklyHours).toBe(6);
    expect(input).toEqual([first, second]);
  });

  it("un catálogo vacío no produce docentes ni asignaciones de ejemplo", () => {
    expect(groupTeacherAssignments([])).toEqual([]);
    expect(filterAcademicSubjects([], "consulta")).toEqual([]);
    expect(selectAcademicSections([], "all", "all")).toEqual([]);
  });

  it("filtra materias por nombre o código ignorando acentos, mayúsculas y espacios", () => {
    const physics: SubjectDto = {
      id: randomUUID(),
      code: "QA-FIS",
      name: "Física aplicada",
      assignedSectionsCount: 0,
      createdAtUtc: "2026-08-01T00:00:00Z",
    };
    const math: SubjectDto = { ...physics, id: randomUUID(), code: "QA-MAT", name: "Matemática" };
    expect(filterAcademicSubjects([physics, math], "  FISICA ")).toEqual([physics]);
    expect(filterAcademicSubjects([physics, math], "qa-mat")).toEqual([math]);
    expect(filterAcademicSubjects([physics, math], "  ")).toEqual([physics, math]);
    expect(filterAcademicSubjects([physics, math], "sin coincidencia")).toEqual([]);
  });

  it("combina año y grado sin mezclar secciones de otro año", () => {
    const yearA = randomUUID(),
      yearB = randomUUID(),
      gradeA = randomUUID(),
      gradeB = randomUUID();
    const first = section(yearA, gradeA),
      second = section(yearB, gradeA),
      third = section(yearA, gradeB);
    const sections = [first, second, third];
    expect(selectAcademicSections(sections, yearA, gradeA)).toEqual([first]);
    expect(selectAcademicSections(sections, "all", gradeA)).toEqual([first, second]);
    expect(selectAcademicSections(sections, yearA, "all")).toEqual([first, third]);
    expect(selectAcademicSections(sections, "all", "all")).toEqual(sections);
  });
});
