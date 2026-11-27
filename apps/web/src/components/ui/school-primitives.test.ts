import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog } from "@/components/ui/dialog";
import { MenuItem } from "@/components/ui/menu-item";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { SidePanel } from "@/components/ui/side-panel";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";

describe("primitivas escolares: contrato semántico", () => {
  it("conserva la casilla nativa, su nombre de formulario y su descripción accesible", () => {
    const markup = renderToStaticMarkup(
      createElement(Checkbox, {
        name: "attendance",
        value: "present",
        checked: true,
        readOnly: true,
        disabled: true,
        "aria-label": "Presente",
        "aria-describedby": "attendance-help",
      }),
    );

    expect(markup).toContain('type="checkbox"');
    expect(markup).toContain('name="attendance"');
    expect(markup).toContain('value="present"');
    expect(markup).toContain('checked=""');
    expect(markup).toContain('disabled=""');
    expect(markup).toContain('aria-label="Presente"');
    expect(markup).toContain('aria-describedby="attendance-help"');
  });

  it("expone el interruptor como control nativo etiquetado y desactivable", () => {
    const markup = renderToStaticMarkup(
      createElement(Switch, {
        "aria-label": "Recibir avisos",
        checked: false,
        readOnly: true,
        disabled: true,
      }),
    );

    expect(markup).toContain('type="checkbox"');
    expect(markup).toContain('role="switch"');
    expect(markup).toContain('aria-label="Recibir avisos"');
    expect(markup).toContain('disabled=""');
    expect(markup).not.toContain('checked=""');
  });

  it("agrupa el segmentado con leyenda, una selección y opciones deshabilitadas", () => {
    const markup = renderToStaticMarkup(
      createElement(SegmentedControl, {
        name: "period",
        label: "Periodo visible",
        value: "current",
        options: [
          { value: "current", label: "Actual" },
          { value: "previous", label: "Anterior", disabled: true },
        ],
        onValueChange: () => {},
        disabled: true,
      }),
    );

    expect(markup).toMatch(/^<fieldset[^>]*disabled=""/);
    expect(markup).toContain('<legend class="sr-only">Periodo visible</legend>');
    const controls = markup.match(/<input\b[^>]*>/g) ?? [];
    expect(controls).toHaveLength(2);
    expect(controls.every((control) => control.includes('name="period"'))).toBe(true);
    expect(controls.every((control) => control.includes('type="radio"'))).toBe(true);
    expect(controls.filter((control) => control.includes('checked=""'))).toHaveLength(1);
    expect(controls[0]).toContain('value="current"');
    expect(controls[0]).toContain('checked=""');
    expect(controls[1]).toContain('disabled=""');
    expect(markup).toContain("Actual</span></label>");
    expect(markup).toContain("Anterior</span></label>");
  });

  it("identifica únicamente el enlace activo y oculta su icono decorativo", () => {
    const active = renderToStaticMarkup(
      createElement(
        MenuItem,
        { href: "/students", active: true, icon: createElement("svg") },
        "Estudiantes",
      ),
    );
    const inactive = renderToStaticMarkup(createElement(MenuItem, { href: "/" }, "Inicio"));

    expect(active).toContain('href="/students"');
    expect(active).toContain('aria-current="page"');
    expect(active).toMatch(/<span aria-hidden="true"[^>]*><svg/);
    expect(active).toContain("Estudiantes</span>");
    expect(inactive).not.toContain("aria-current");
  });

  it.each([Dialog, SidePanel])("mantiene el diálogo nativo cerrado y etiquetado", (Component) => {
    const markup = renderToStaticMarkup(
      createElement(
        Component,
        { "aria-labelledby": "dialog-title" },
        createElement("h2", { id: "dialog-title" }, "Confirmar acción"),
      ),
    );

    expect(markup).toMatch(/^<dialog\b/);
    expect(markup).toContain('aria-labelledby="dialog-title"');
    expect(markup).toContain('<h2 id="dialog-title">Confirmar acción</h2>');
    expect(markup).not.toMatch(/\sopen(?:=|\s|>)/);
  });

  it("excluye el esqueleto decorativo del árbol accesible", () => {
    const markup = renderToStaticMarkup(createElement(Skeleton));
    expect(markup).toContain('aria-hidden="true"');
  });
});
