import { describe, expect, it } from "vitest";
import {
  getActiveSchoolNavigationItem,
  getSchoolNavigationItems,
  normalizeSchoolPath,
} from "./school-navigation";

describe("navegación escolar", () => {
  it("mantiene Inicio disponible sin conceder acceso a módulos sin permiso", () => {
    expect(getSchoolNavigationItems([]).map((item) => item.href)).toEqual(["/"]);
    expect(
      getSchoolNavigationItems(["institution.students.write"]).map((item) => item.href),
    ).toEqual(["/"]);
  });

  it("agrupa estudiantes y responsables únicamente con lectura del directorio", () => {
    const items = getSchoolNavigationItems(["institution.students.read"]);
    expect(items.map((item) => item.href)).toEqual(["/", "/students", "/guardians"]);
    expect(items.filter((item) => item.group).every((item) => item.group === "Estudiantes")).toBe(
      true,
    );
  });

  it("no introduce roles, auditoría ni soporte al mostrar los ajustes autorizados", () => {
    const items = getSchoolNavigationItems([
      "institution.context.read",
      "institution.members.read",
      "institution.grading.read",
      "institution.support-access.read",
      "institution.audit.read",
    ]);
    const paths = items.map((item) => item.href);
    expect(paths).toContain("/settings");
    expect(paths).toContain("/settings/policies");
    expect(paths).toContain("/members");
    expect(paths).toContain("/moodle");
    expect(paths).not.toContain("/roles");
    expect(paths).not.toContain("/audit");
    expect(paths).not.toContain("/support-access");
  });

  it.each([
    ["/school", "/"],
    ["/school/academic", "/academic/years"],
    ["/school/evaluations", "/grading"],
    ["/academic/sections/section-id", "/academic/grades"],
  ])("normaliza la ruta heredada %s a %s", (path, expected) => {
    expect(normalizeSchoolPath(path)).toBe(expected);
  });

  it("selecciona el destino más específico para políticas dentro de Ajustes", () => {
    const items = getSchoolNavigationItems([
      "institution.context.read",
      "institution.grading.read",
    ]);
    const active = getActiveSchoolNavigationItem(items, "/school/settings/policies/policy-id");
    expect(active?.href).toBe("/settings/policies");
    expect(active?.group).toBe("Ajustes");
  });

  it("mantiene activo Estudiantes al abrir una ficha sin confundir prefijos de otras rutas", () => {
    const items = getSchoolNavigationItems(["institution.students.read"]);
    expect(getActiveSchoolNavigationItem(items, "/students/student-id")?.href).toBe("/students");
    expect(getActiveSchoolNavigationItem(items, "/students-export")?.href).toBe("/");
  });

  it("no activa una ruta a la que la cuenta no puede acceder", () => {
    const items = getSchoolNavigationItems([]);
    expect(getActiveSchoolNavigationItem(items, "/academic/years")?.href).toBe("/");
    expect(getActiveSchoolNavigationItem([], "/students")).toBeUndefined();
  });
});
