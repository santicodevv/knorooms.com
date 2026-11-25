import { createElement, type FunctionComponent, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SchoolFormField } from "./school-form-field";
import { SchoolSidePanel } from "./school-side-panel";
import { StudentFormField } from "../students/components/student-form-field";

function withChild<P extends { children: ReactNode }>(
  component: FunctionComponent<P>,
  props: Omit<P, "children">,
  child: ReactNode,
) {
  // React completa children con el tercer argumento; la firma de tipos exige P por separado.
  return createElement(component, props as P, child);
}

describe("formularios escolares compartidos", () => {
  it("conserva la etiqueta, la ayuda y el error asociados al identificador del campo", () => {
    const html = renderToStaticMarkup(
      withChild(
        SchoolFormField,
        {
          id: "qa-field",
          label: "Nombre",
          error: "Indica un nombre válido.",
          hint: "Usa el nombre completo.",
        },
        createElement("input", {
          id: "qa-field",
          "aria-invalid": true,
          "aria-describedby": "qa-field-hint qa-field-error",
        }),
      ),
    );
    expect(html).toContain('for="qa-field"');
    expect(html).toContain('id="qa-field-hint"');
    expect(html).toContain('id="qa-field-error"');
    expect(html).toContain('aria-describedby="qa-field-hint qa-field-error"');
    expect(html).toContain('aria-invalid="true"');
  });

  it("no crea errores vacíos y conserva la implementación de los campos de estudiantes", () => {
    expect(StudentFormField).toBe(SchoolFormField);
    const html = renderToStaticMarkup(
      withChild(
        SchoolFormField,
        {
          id: "qa-code",
          label: "Código",
        },
        createElement("input", { id: "qa-code" }),
      ),
    );
    expect(html).not.toContain('id="qa-code-error"');
    expect(html).not.toContain('id="qa-code-hint"');
  });

  it("mantiene la referencia del título y sólo el radio rectangular del panel", () => {
    const html = renderToStaticMarkup(
      withChild(
        SchoolSidePanel,
        {
          title: "Nuevo registro",
          titleId: "qa-title",
          subtitle: "Datos del colegio",
          busy: false,
          onClose() {},
          onSubmit(event) {
            event.preventDefault();
          },
          submitLabel: "Guardar",
        },
        createElement("input", { name: "code" }),
      ),
    );
    expect(html).toContain('aria-labelledby="qa-title"');
    expect(html).toContain('id="qa-title"');
    expect(html).toContain("rounded-none");
    expect(html).not.toContain("rounded-school-panel");
    expect(html).toContain('aria-busy="false"');
  });

  it("deshabilita los tres controles de cierre y envío mientras guarda", () => {
    const html = renderToStaticMarkup(
      withChild(
        SchoolSidePanel,
        {
          title: "Nuevo registro",
          subtitle: "Datos del colegio",
          busy: true,
          onClose() {},
          onSubmit(event) {
            event.preventDefault();
          },
          submitLabel: "Guardar",
        },
        createElement("input", { name: "code", disabled: true }),
      ),
    );
    expect(html).toContain('aria-busy="true"');
    expect(html.match(/<button[^>]*disabled=""/g)).toHaveLength(3);
    expect(html).toContain("Guardando…");
  });

  it("bloquea sólo el envío sin dependencias y permite cancelar", () => {
    const html = renderToStaticMarkup(
      withChild(
        SchoolSidePanel,
        {
          title: "Nuevo registro",
          subtitle: "Falta completar la estructura",
          busy: false,
          submitDisabled: true,
          onClose() {},
          onSubmit(event) {
            event.preventDefault();
          },
          submitLabel: "Guardar",
        },
        createElement("p", {}, "No hay secciones disponibles."),
      ),
    );
    expect(html).toContain('aria-busy="false"');
    expect(html.match(/<button[^>]*disabled=""/g)).toHaveLength(1);
    expect(html).toMatch(/<button[^>]*type="submit"[^>]*disabled=""/);
  });
});
