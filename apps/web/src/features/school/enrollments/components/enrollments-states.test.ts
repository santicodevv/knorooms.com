import { randomUUID } from "node:crypto";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { EnrollmentsWorkspaceData } from "../schemas/enrollment-types";
import { useEnrollmentsWorkspace } from "../hooks/use-enrollments-workspace";
import { EnrollmentsWorkspace } from "./enrollments-workspace";
import { EnrollmentPanel } from "./enrollment-panel";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

function data(): EnrollmentsWorkspaceData {
  const yearId = randomUUID(),
    sectionId = randomUUID();
  return {
    years: [{ id: yearId, code: "QA-YEAR", isClosed: false }],
    students: [
      {
        id: randomUUID(),
        studentCode: "QA-PERSON",
        fullName: "Persona elegible",
        sigerdExternalId: null,
        isActive: true,
      },
    ],
    overview: {
      enrollments: [],
      sectionCapacities: [
        {
          sectionId,
          academicYearId: yearId,
          academicYearCode: "QA-YEAR",
          isAcademicYearClosed: false,
          gradeLevelName: "Primero de prueba",
          sectionCode: "A",
          shift: "Morning",
          capacity: 20,
          activeEnrollmentsCount: 0,
          availableSeats: 20,
        },
      ],
    },
    problems: [],
    canReadEnrollments: true,
    canManageEnrollments: true,
    canReadStudents: true,
    csrfToken: randomUUID(),
  };
}
function panel(input: EnrollmentsWorkspaceData) {
  function Harness() {
    const state = useEnrollmentsWorkspace(input);
    return createElement(EnrollmentPanel, { state });
  }
  return renderToStaticMarkup(createElement(Harness));
}
function workspace(input: EnrollmentsWorkspaceData) {
  return renderToStaticMarkup(createElement(EnrollmentsWorkspace, { data: input }));
}

describe("estados de matrícula sin datos de ejemplo", () => {
  it("distingue la falta de permiso de una consulta vacía", () => {
    const input = data();
    input.canReadEnrollments = false;
    input.canManageEnrollments = false;
    input.overview = null;
    input.students = null;
    const html = workspace(input);
    expect(html).toContain("Sin permiso para consultar matrículas");
    expect(html).not.toContain("Matricular estudiante");
    expect(html).not.toContain("Persona elegible");
  });
  it("preserva un error de capacidades sin llamarlo falta de permiso", () => {
    const input = data();
    input.overview = null;
    input.canReadEnrollments = false;
    input.canManageEnrollments = false;
    input.problems = [
      { source: "capabilities", problem: { title: "Capacidades no disponibles", status: 503 } },
    ];
    const html = workspace(input);
    expect(html).toContain("No se pudo cargar la información");
    expect(html).toContain("Reintentar");
    expect(html).not.toContain("Sin permiso para consultar matrículas");
  });
  it("muestra años y secciones reales en vacío sin inventar una matrícula", () => {
    const input = data();
    input.years = [];
    input.overview = { enrollments: [], sectionCapacities: [] };
    input.students = [];
    const html = workspace(input);
    expect(html).toContain("No hay secciones en este año escolar.");
    expect(html).not.toContain("QA-YEAR");
    expect(html).not.toContain("Persona elegible");
    expect(html).not.toContain("Matricular estudiante");
  });
  it("mantiene consulta de matrículas sin gestión ni enlace al expediente sin lectura de estudiantes", () => {
    const input = data();
    input.canManageEnrollments = false;
    input.canReadStudents = false;
    input.students = null;
    const section = input.overview!.sectionCapacities[0];
    input.overview!.enrollments = [
      {
        id: randomUUID(),
        studentId: randomUUID(),
        studentCode: "QA-ENROLLED",
        studentFullName: "Nombre autorizado de matrícula",
        academicYearId: section.academicYearId,
        sectionId: section.sectionId,
        status: "Active",
        enrolledAtUtc: "2026-11-25T00:00:00Z",
      },
    ];
    const html = workspace(input);
    expect(html).toContain("Nombre autorizado de matrícula");
    expect(html).not.toContain("Matricular estudiante");
    expect(html).not.toContain('href="/students/');
  });
  it("un año cerrado conserva historial pero no ofrece matriculación", () => {
    const input = data();
    input.years![0].isClosed = true;
    input.overview!.sectionCapacities[0].isAcademicYearClosed = true;
    const html = workspace(input);
    expect(html).toContain("Año cerrado · Solo consulta");
    expect(html).not.toContain("Matricular estudiante");
  });
  it("no permite editar la fecha asignada por el servidor", () => {
    const html = panel(data());
    expect(html).toContain("Se registra automáticamente al matricular");
    expect(html).toMatch(/<input[^>]*readOnly=""/i);
    expect(html).not.toContain('name="enrolledAtUtc"');
    expect(html).not.toContain('name="enrollmentDate"');
  });
  it("excluye de las opciones estudiantes inactivos y cualquier matrícula del mismo año", () => {
    const input = data();
    const section = input.overview!.sectionCapacities[0];
    const inactive = {
      ...input.students![0],
      id: randomUUID(),
      fullName: "Persona inactiva",
      isActive: false,
    };
    const withdrawn = {
      ...input.students![0],
      id: randomUUID(),
      fullName: "Persona con matrícula retirada",
    };
    input.students!.push(inactive, withdrawn);
    input.overview!.enrollments.push({
      id: randomUUID(),
      studentId: withdrawn.id,
      studentCode: withdrawn.studentCode,
      studentFullName: withdrawn.fullName,
      academicYearId: section.academicYearId,
      sectionId: section.sectionId,
      status: "Withdrawn",
      enrolledAtUtc: "2026-11-25T00:00:00Z",
    });
    const html = panel(input);
    expect(html).toContain("Persona elegible");
    expect(html).not.toContain("Persona inactiva");
    expect(html).not.toContain("Persona con matrícula retirada");
  });
  it.each(["students", "sections"] as const)(
    "sin %s disponibles bloquea sólo el envío y permite cancelar",
    (reason) => {
      const input = data();
      if (reason === "students") input.students = [];
      else input.overview!.sectionCapacities[0].availableSeats = 0;
      const html = panel(input);
      expect(html.match(/<button[^>]*disabled=""/g)).toHaveLength(1);
      expect(html).toMatch(/<button[^>]*type="submit"[^>]*disabled=""/);
      expect(html).toContain("Cancelar");
    },
  );
});
