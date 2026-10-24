import { describe, expect, it } from "vitest";
import {
  dependentModules,
  enableDependencies,
  provisionDefaults,
  provisionSchema,
  readDirectoryFilters,
  type ProductModule,
} from "./institution-management-schemas";
const catalog: ProductModule[] = [
  { code: "students", name: "Estudiantes", dependencies: [], available: true },
  { code: "academic", name: "Académico", dependencies: [], available: true },
  {
    code: "enrollments",
    name: "Matrículas",
    dependencies: ["students", "academic"],
    available: true,
  },
  { code: "grading", name: "Evaluación", dependencies: ["enrollments"], available: true },
  { code: "reportcards", name: "Boletas", dependencies: ["grading"], available: true },
  { code: "moodle", name: "Moodle", dependencies: [], available: false },
];
describe("Flujo de instituciones", () => {
  it("habilita toda la cadena de dependencias de boletas", () =>
    expect(enableDependencies([], "reportcards", catalog).sort()).toEqual([
      "academic",
      "enrollments",
      "grading",
      "reportcards",
      "students",
    ]));
  it("detecta los módulos afectados al desactivar una dependencia", () =>
    expect(
      dependentModules(
        ["students", "academic", "enrollments", "grading", "reportcards"],
        "academic",
        catalog,
      ),
    ).toEqual(["academic", "enrollments", "grading", "reportcards"]));
  it("no habilita Moodle mientras esté pendiente", () =>
    expect(enableDependencies([], "moodle", catalog)).toEqual([]));
  it("exige contacto y rechaza subdominios reservados", () => {
    expect(
      provisionSchema.safeParse({
        ...provisionDefaults,
        name: "Colegio",
        slug: "admin",
        contactEmail: "contact@example.test",
      }).success,
    ).toBe(false);
    expect(
      provisionSchema.safeParse({
        ...provisionDefaults,
        name: "Colegio",
        slug: "colegio-a",
        contactEmail: "contact@example.test",
      }).success,
    ).toBe(true);
  });
  it("valida los filtros de la URL", () => {
    expect(readDirectoryFilters({ page: "-1", pageSize: "999", status: "fake" })).toMatchObject({
      page: 1,
      pageSize: 10,
      status: "",
    });
  });
});
