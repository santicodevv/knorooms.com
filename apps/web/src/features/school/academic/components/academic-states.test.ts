import { randomUUID } from "node:crypto";
import { createElement, type ComponentProps } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { AcademicWorkspace } from "./academic-workspace";
import { AcademicRecordForm } from "./academic-record-form";
import { useAcademicWorkspace } from "../hooks/use-academic-workspace";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
}));
function props(): ComponentProps<typeof AcademicWorkspace> {
  const yearId = randomUUID(),
    gradeId = randomUUID();
  return {
    path: ["academic", "years"],
    initialOverview: {
      academicYears: [
        {
          id: yearId,
          code: "QA-YEAR",
          name: "Año de prueba",
          startDate: "2026-08-01",
          endDate: "2027-06-30",
          isClosed: false,
          sectionsCount: 1,
          createdAtUtc: "2026-08-01T00:00:00Z",
        },
      ],
      gradeLevels: [
        {
          id: gradeId,
          stage: "Primary",
          officialGradeNumber: 1,
          code: "QA-P1",
          displayName: "Primero de prueba",
          sectionsCount: 1,
          createdAtUtc: "2026-08-01T00:00:00Z",
        },
      ],
      sections: [
        {
          id: randomUUID(),
          academicYearId: yearId,
          academicYearCode: "QA-YEAR",
          gradeLevelId: gradeId,
          gradeLevelCode: "QA-P1",
          gradeLevelName: "Primero de prueba",
          code: "A",
          shift: "Morning",
          capacity: 20,
          assignedSubjectsCount: 0,
          createdAtUtc: "2026-08-01T00:00:00Z",
        },
      ],
      subjects: [
        {
          id: randomUUID(),
          code: "QA-SUB",
          name: "Materia de prueba",
          assignedSectionsCount: 0,
          createdAtUtc: "2026-08-01T00:00:00Z",
        },
      ],
      teacherAssignments: [],
    },
    initialProblem: null,
    csrfToken: randomUUID(),
    members: [
      {
        membershipId: randomUUID(),
        displayName: "Miembro activo sin rol prefijado",
        status: "Active",
      },
    ],
    canReadAcademic: true,
    canManageAcademic: true,
    overviewAvailable: true,
    canReadMembers: true,
    membersAvailable: true,
    canReadEnrollments: false,
    initialSectionCapacities: null,
  };
}
function render(input: ComponentProps<typeof AcademicWorkspace>) {
  return renderToStaticMarkup(createElement(AcademicWorkspace, input));
}
function panel(input: ComponentProps<typeof AcademicWorkspace>, kind = "assignment") {
  function Harness() {
    const state = useAcademicWorkspace(input);
    return createElement(AcademicRecordForm, {
      kind,
      state,
      members: input.members,
      canReadMembers: input.canReadMembers,
      membersAvailable: input.membersAvailable,
    });
  }
  return renderToStaticMarkup(createElement(Harness));
}
describe("estados y permisos de organización académica", () => {
  it("no presenta una estructura sin permiso como un año vacío", () => {
    const input = props();
    input.canReadAcademic = false;
    input.overviewAvailable = false;
    input.canManageAcademic = false;
    const html = render(input);
    expect(html).toContain("Sin permiso para consultar la estructura académica");
    expect(html).not.toContain("QA-YEAR");
    expect(html).not.toContain("Crear año escolar");
  });
  it("mantiene el error de capacidades como error con reintento", () => {
    const input = props();
    input.canReadAcademic = false;
    input.overviewAvailable = false;
    input.initialProblem = { title: "Capacidades no disponibles", status: 503 };
    const html = render(input);
    expect(html).toContain("No se pudo cargar la información");
    expect(html).toContain("Reintentar");
    expect(html).not.toContain("Sin permiso para consultar la estructura académica");
  });
  it("mantiene datos históricos sin ofrecer cerrar ni crear años", () => {
    const input = props();
    input.canManageAcademic = false;
    const html = render(input);
    expect(html).toContain("QA-YEAR");
    expect(html).not.toContain("Crear año escolar");
    expect(html).not.toContain("Cerrar año");
  });
  it.each(["years", "grades", "subjects", "assignments"])(
    "deniega la ruta directa de alta %s sin gestión",
    (view) => {
      const input = props();
      input.path = ["academic", view, "new"];
      input.canManageAcademic = false;
      const html = render(input);
      expect(html).toContain("Sin permiso para modificar la estructura académica");
      expect(html).not.toContain("<dialog");
    },
  );
  it.each([
    [false, true, "Sin permiso para consultar miembros"],
    [true, false, "Información de miembros no disponible"],
  ] as const)("bloquea asignación cuando lectura=%s disponible=%s", (read, available, title) => {
    const input = props();
    input.canReadMembers = read;
    input.membersAvailable = available;
    const html = panel(input);
    expect(html).toContain(title);
    expect(html).not.toContain('name="teacherMembershipId"');
    expect(html.match(/<button[^>]*disabled=""/g)).toHaveLength(1);
  });
  it("ofrece miembros activos sin exigir un nombre de rol que el contrato no pide", () => {
    const input = props();
    input.members.push({
      membershipId: randomUUID(),
      displayName: "Membresía revocada",
      status: "Revoked",
    });
    const html = panel(input);
    expect(html).toContain("Miembro activo sin rol prefijado");
    expect(html).not.toContain("Membresía revocada");
  });
  it("sin un año abierto impide crear una sección y conserva Cancelar", () => {
    const input = props();
    input.initialOverview.academicYears[0].isClosed = true;
    const html = panel(input, "section");
    expect(html).toContain("Necesitas un año escolar abierto y un grado registrado");
    expect(html.match(/<button[^>]*disabled=""/g)).toHaveLength(1);
    expect(html).toContain("Cancelar");
  });
});
