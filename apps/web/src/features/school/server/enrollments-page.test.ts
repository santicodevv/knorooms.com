import { randomUUID } from "node:crypto";
import type { ReactElement } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SchoolEnrollmentsPage } from "./enrollments-page";

const mocks = vi.hoisted(() => ({ context: vi.fn(), capabilities: vi.fn(), api: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("./school-context", () => ({
  getSchoolContext: mocks.context,
  getSchoolCapabilities: mocks.capabilities,
  schoolViewKey: () => "vista-de-prueba",
}));
vi.mock("@/lib/api/server-api", () => ({ serverApiFetch: mocks.api }));
vi.mock("@/components/school/school-page-access", () => ({ SchoolPageAccess: () => null }));
vi.mock("@/features/school/enrollments/components/enrollments-workspace", () => ({
  EnrollmentsWorkspace: () => null,
}));
const permissions = [
  "institution.enrollments.read",
  "institution.enrollments.manage",
  "institution.students.read",
  "institution.academic.read",
];
const person = {
  id: randomUUID(),
  studentCode: "QA-CODE",
  fullName: "Persona de prueba",
  sigerdExternalId: null,
  isActive: true,
  guardians: [{ email: "private@example.invalid" }],
  firstName: "Persona",
  birthDate: "2015-01-01",
};
const year = {
  id: randomUUID(),
  code: "QA-YEAR",
  name: "Año de prueba",
  startDate: "2026-08-01",
  endDate: "2027-06-30",
  isClosed: false,
};
const enrollment = {
  id: randomUUID(),
  studentId: person.id,
  studentCode: person.studentCode,
  studentFullName: person.fullName,
  academicYearId: year.id,
  sectionId: randomUUID(),
  status: "Active",
  enrolledAtUtc: "2026-11-25T00:00:00Z",
  sigerdExternalId: null,
  shift: "Morning",
};
const overview = { enrollments: [enrollment], sectionCapacities: [] };
function context(permitted = permissions) {
  return {
    session: { csrfToken: randomUUID() },
    contextResult: { ok: true, data: { permissions: permitted } },
    rawHost: "colegio-a.localhost:3101",
    slug: "colegio-a",
  };
}
function capabilities(canRead = true, canWrite = true) {
  return {
    ok: true,
    data: {
      modules: ["enrollments", "students", "academic"].map((code) => ({ code, canRead, canWrite })),
    },
  };
}
function data(
  page: ReactElement<{ children: ReactElement<{ data: Record<string, unknown> }> | false | null }>,
) {
  if (!page.props.children) throw new Error("Se esperaba una vista autenticada.");
  return page.props.children.props.data;
}
beforeEach(() => {
  vi.clearAllMocks();
  mocks.context.mockResolvedValue(context());
  mocks.capabilities.mockResolvedValue(capabilities());
  mocks.api.mockImplementation(async (path: string) => ({
    ok: true,
    data: path.includes("academic")
      ? { academicYears: [year] }
      : path.includes("students")
        ? { students: [person], guardians: [{ email: "private@example.invalid" }] }
        : overview,
  }));
});
describe("carga mínima y autorizada de matrículas", () => {
  it("no consulta datos ni capacidades sin sesión", async () => {
    mocks.context.mockResolvedValue({ ...context(), session: null, contextResult: null });
    expect((await SchoolEnrollmentsPage()).props.children).toBeNull();
    expect(mocks.api).not.toHaveBeenCalled();
    expect(mocks.capabilities).not.toHaveBeenCalled();
  });
  it("no consulta datos tras rechazar el contexto institucional", async () => {
    mocks.context.mockResolvedValue({
      ...context(),
      contextResult: { ok: false, problem: { title: "Sin acceso", status: 403 } },
    });
    expect((await SchoolEnrollmentsPage()).props.children).toBe(false);
    expect(mocks.api).not.toHaveBeenCalled();
  });
  it("no consulta módulos adicionales si falta lectura de matrículas", async () => {
    mocks.context.mockResolvedValue(
      context(["institution.academic.read", "institution.students.read"]),
    );
    const props = data(await SchoolEnrollmentsPage());
    expect(mocks.api).not.toHaveBeenCalled();
    expect(props).toMatchObject({
      canReadEnrollments: false,
      overview: null,
      students: null,
      years: null,
    });
  });
  it("exige capacidad de lectura además de los permisos", async () => {
    mocks.capabilities.mockResolvedValue(capabilities(false, false));
    const props = data(await SchoolEnrollmentsPage());
    expect(mocks.api).not.toHaveBeenCalled();
    expect(props.canReadEnrollments).toBe(false);
  });
  it("conserva consulta histórica sin descargar el directorio personal cuando no puede matricular", async () => {
    mocks.capabilities.mockResolvedValue(capabilities(true, false));
    const props = data(await SchoolEnrollmentsPage());
    expect(mocks.api).toHaveBeenCalledWith("/api/tenant/enrollments/overview");
    expect(mocks.api).not.toHaveBeenCalledWith("/api/tenant/students/overview");
    expect(props).toMatchObject({
      canReadEnrollments: true,
      canManageEnrollments: false,
      students: null,
    });
  });
  it("respeta los permisos independientes de directorio y estructura académica", async () => {
    mocks.context.mockResolvedValue(
      context(["institution.enrollments.read", "institution.enrollments.manage"]),
    );
    const props = data(await SchoolEnrollmentsPage());
    expect(mocks.api).toHaveBeenCalledTimes(1);
    expect(props).toMatchObject({ students: null, years: null, canReadStudents: false });
  });
  it("proyecta sólo campos de selección y excluye responsables y fechas de nacimiento", async () => {
    const props = data(await SchoolEnrollmentsPage());
    expect(props.students).toEqual([
      {
        id: person.id,
        studentCode: person.studentCode,
        fullName: person.fullName,
        sigerdExternalId: null,
        isActive: true,
      },
    ]);
    expect(props.years).toEqual([{ id: year.id, code: year.code, isClosed: false }]);
    expect(JSON.stringify(props)).not.toContain("private@example.invalid");
    expect(JSON.stringify(props)).not.toContain("birthDate");
  });
  it("conserva el fallo de capacidades y no ejecuta consultas con acceso desconocido", async () => {
    const problem = { title: "Capacidades no disponibles", status: 503 };
    mocks.capabilities.mockResolvedValue({ ok: false, problem });
    const props = data(await SchoolEnrollmentsPage());
    expect(mocks.api).not.toHaveBeenCalled();
    expect(props.problems).toEqual([{ source: "capabilities", problem }]);
    expect(props.overview).toBeNull();
  });
  it("distingue el fallo de matrículas de un listado vacío válido", async () => {
    const problem = { title: "Matrículas no disponibles", status: 503 };
    mocks.api.mockImplementation(async (path: string) =>
      path.includes("enrollments")
        ? { ok: false, problem }
        : {
            ok: true,
            data: path.includes("students")
              ? { students: [], guardians: [] }
              : { academicYears: [] },
          },
    );
    const failed = data(await SchoolEnrollmentsPage());
    expect(failed.overview).toBeNull();
    expect(failed.problems).toContainEqual({ source: "enrollments", problem });
    mocks.api.mockImplementation(async (path: string) => ({
      ok: true,
      data: path.includes("enrollments")
        ? { enrollments: [], sectionCapacities: [] }
        : path.includes("students")
          ? { students: [], guardians: [] }
          : { academicYears: [] },
    }));
    const empty = data(await SchoolEnrollmentsPage());
    expect(empty).toMatchObject({
      overview: { enrollments: [], sectionCapacities: [] },
      problems: [],
    });
  });
});
