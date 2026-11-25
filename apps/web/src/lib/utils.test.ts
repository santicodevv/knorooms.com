import { describe, expect, it } from "vitest";
import { cn } from "@/lib/utils";

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
