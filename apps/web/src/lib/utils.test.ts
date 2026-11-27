import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { cn } from "@/lib/utils";
import { SidePanel } from "@/components/ui/side-panel";

describe("cn: tipografía escolar", () => {
  it.each(["body", "button", "small"])("conserva el tamaño %s junto al color del texto", (size) => {
    const classes = cn(`text-school-${size}`, "text-school-ink").split(" ");
    expect(classes).toContain(`text-school-${size}`);
    expect(classes).toContain("text-school-ink");
  });

  it("permite sustituir el tamaño sin perder el color escolar", () => {
    const classes = cn("text-school-body text-school-surface", "text-school-small").split(" ");
    expect(classes).toContain("text-school-small");
    expect(classes).toContain("text-school-surface");
    expect(classes).not.toContain("text-school-body");
  });

  it("permite sustituir el color sin perder el tamaño escolar", () => {
    const classes = cn("text-school-button text-school-surface", "text-school-ink").split(" ");
    expect(classes).toContain("text-school-button");
    expect(classes).toContain("text-school-ink");
    expect(classes).not.toContain("text-school-surface");
  });

  it("conserva tamaño y color en la variante escolar y acepta un tamaño estándar", () => {
    const initial = cn("school:text-school-body school:text-school-ink").split(" ");
    expect(initial).toContain("school:text-school-body");
    expect(initial).toContain("school:text-school-ink");

    const override = cn(initial, "school:text-sm").split(" ");
    expect(override).toContain("school:text-sm");
    expect(override).toContain("school:text-school-ink");
    expect(override).not.toContain("school:text-school-body");
  });
});

describe("cn: radios escolares", () => {
  it("permite quitar el radio del diálogo al componer un panel lateral", () => {
    expect(cn("rounded-school-panel", "rounded-none")).toBe("rounded-none");
  });

  it("permite restaurar un radio escolar después de una clase estándar", () => {
    expect(cn("rounded-none", "rounded-school-panel")).toBe("rounded-school-panel");
  });

  it("resuelve los radios dentro de su variante sin eliminar otros contextos", () => {
    expect(cn("rounded-school-panel school:rounded-school-panel", "school:rounded-none")).toBe(
      "rounded-school-panel school:rounded-none",
    );
    expect(cn("school:rounded-none", "school:rounded-school-panel")).toBe(
      "school:rounded-school-panel",
    );
  });

  it("renderiza SidePanel con un único radio efectivo sin esquinas redondeadas", () => {
    const markup = renderToStaticMarkup(
      createElement(
        SidePanel,
        { "aria-labelledby": "panel-test-title" },
        createElement("h2", { id: "panel-test-title" }, "Panel de prueba"),
      ),
    );
    const classes = markup.match(/class="([^"]+)"/)?.[1].split(" ") ?? [];
    expect(classes.filter((value) => value.startsWith("rounded-"))).toEqual(["rounded-none"]);
    expect(markup).toContain('data-panel="side"');
  });
});
