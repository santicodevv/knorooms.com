import { randomUUID } from "node:crypto";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { StudentsWorkspace } from "./students-workspace";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/students",
}));
function props() {
  return {
    initialDirectory: { students: [], guardians: [] },
    initialEnrollments: { enrollments: [], sectionCapacities: [] },
    initialProblem: null,
    csrfToken: randomUUID(),
    canManageStudents: false,
    canManageEnrollments: false,
    canReadStudents: true,
    canReadEnrollments: true,
    directoryAvailable: true,
    enrollmentsAvailable: true,
  };
}

describe("estados del workspace escolar", () => {
  it.each(["students", "guardians"])(
    "rechaza alta directa de %s sin permiso de gestión",
    (area) => {
      const markup = renderToStaticMarkup(
        createElement(StudentsWorkspace, { ...props(), path: [area, "new"] }),
      );
      expect(markup).toContain("Sin permiso para crear registros");
      expect(markup).toContain(`href="/${area}"`);
      expect(markup).not.toContain("<form");
      expect(markup).not.toContain("<dialog");
    },
  );

  it("no confunde un fallo del directorio con falta de permiso para crear", () => {
    const markup = renderToStaticMarkup(
      createElement(StudentsWorkspace, {
        ...props(),
        path: ["students", "new"],
        canManageStudents: true,
        directoryAvailable: false,
        initialProblem: { title: "Error de consulta QA", status: 503 },
      }),
    );
    expect(markup).toContain("Error de consulta QA");
    expect(markup).toContain("No se pudo cargar la información");
    expect(markup).toContain("Reintentar");
    expect(markup).not.toContain("Sin permiso para crear registros");
    expect(markup).not.toContain("<form");
  });

  it("distingue la ausencia de lectura de un directorio disponible vacío", () => {
    const markup = renderToStaticMarkup(
      createElement(StudentsWorkspace, {
        ...props(),
        path: ["students"],
        canReadStudents: false,
        directoryAvailable: false,
      }),
    );
    expect(markup).toContain("Sin permiso para consultar estudiantes");
    expect(markup).not.toContain("Crear primer expediente");
    expect(markup).not.toContain("Nuevo estudiante");
  });
});
