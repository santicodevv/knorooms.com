import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SchoolHomeActions } from "./school-home-actions";
import { SchoolHomeChart } from "./school-home-chart";

describe("estados del Inicio escolar", () => {
  it.each([
    [false, false, false, "Sin permiso para consultar matrículas"],
    [true, true, false, "Aún no hay años escolares"],
    [true, false, true, "Aún no hay matrículas"],
    [true, false, false, "Información no disponible"],
  ])("distingue permiso=%s, sin año=%s y disponible=%s", (allowed, noYear, available, title) => {
    const markup = renderToStaticMarkup(
      createElement(SchoolHomeChart, {
        chart: [],
        allowed,
        noYear,
        available,
        canEnroll: false,
        canOrganize: false,
      }),
    );
    expect(markup).toContain(title);
    expect(markup).not.toContain('role="img"');
    expect(markup).not.toContain('href="/enrollments"');
    expect(markup).not.toContain('href="/academic/years"');
  });

  it("ofrece matricular solo cuando el consumidor autoriza la escritura", () => {
    const props = { chart: [], allowed: true, noYear: false, available: true, canOrganize: false };
    const writable = renderToStaticMarkup(
      createElement(SchoolHomeChart, { ...props, canEnroll: true }),
    );
    const readOnly = renderToStaticMarkup(
      createElement(SchoolHomeChart, { ...props, canEnroll: false }),
    );
    expect(writable).toContain('href="/enrollments"');
    expect(writable).toContain("Matricular estudiante");
    expect(readOnly).not.toContain('href="/enrollments"');
  });

  it("presenta las cifras del gráfico en su alternativa accesible", () => {
    const markup = renderToStaticMarkup(
      createElement(SchoolHomeChart, {
        chart: [
          { key: "2026-08", label: "ago", count: 3 },
          { key: "2026-09", label: "sept", count: 0 },
        ],
        available: true,
        noYear: false,
        allowed: true,
        canEnroll: false,
        canOrganize: false,
      }),
    );
    expect(markup).toContain('role="img" aria-label="ago: 3, sept: 0"');
    expect(markup).not.toContain("Aún no hay matrículas");
  });

  it.each([
    [[], ["students"]],
    [["institution.students.read"], []],
  ])(
    "oculta tareas si falta permiso o disponibilidad comercial",
    (permissions, readableModules) => {
      const markup = renderToStaticMarkup(
        createElement(SchoolHomeActions, { permissions, readableModules }),
      );
      expect(markup).not.toContain('href="/students"');
      expect(markup).toContain("No tienes tareas disponibles");
    },
  );

  it("ofrece únicamente las tareas que cumplen ambos requisitos de lectura", () => {
    const markup = renderToStaticMarkup(
      createElement(SchoolHomeActions, {
        permissions: ["institution.students.read", "institution.attendance.read"],
        readableModules: ["students"],
      }),
    );
    expect(markup).toContain('href="/students"');
    expect(markup).not.toContain('href="/attendance"');
    expect(markup).not.toContain('href="/grading"');
  });
});
