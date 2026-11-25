import { randomUUID } from "node:crypto";
import type { ReactElement } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SchoolStudentsPage } from "./students-page";

const mocks = vi.hoisted(() => ({ context: vi.fn(), capabilities: vi.fn(), api: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("./school-context", () => ({
  getSchoolContext: mocks.context,
  getSchoolCapabilities: mocks.capabilities,
  schoolViewKey: () => "clave-de-vista-de-prueba",
}));
vi.mock("@/lib/api/server-api", () => ({ serverApiFetch: mocks.api }));
vi.mock("@/components/school/school-shell", () => ({ SchoolShell: () => null }));
vi.mock("@/features/school/students/components/students-workspace", () => ({
  StudentsWorkspace: () => null,
}));

const permissions = [
  "institution.students.read",
  "institution.students.manage",
  "institution.enrollments.read",
  "institution.enrollments.manage",
];
const directory = { students: [], guardians: [] };
const enrollments = { enrollments: [], sectionCapacities: [] };
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
    data: { modules: ["students", "enrollments"].map((code) => ({ code, canRead, canWrite })) },
  };
}
function workspace(page: ReactElement<{ children: ReactElement<Record<string, unknown>> | null }>) {
  if (!page.props.children) throw new Error("La prueba esperaba el workspace autorizado.");
  return page.props.children.props;
}
beforeEach(() => {
  vi.clearAllMocks();
  mocks.context.mockResolvedValue(context());
  mocks.capabilities.mockResolvedValue(capabilities());
  mocks.api.mockImplementation(async (path: string) => ({
    ok: true,
    data: path.includes("students") ? directory : enrollments,
  }));
});

describe("carga del servidor de Estudiantes y Responsables", () => {
  it("no consulta capacidades ni datos institucionales sin sesión", async () => {
    mocks.context.mockResolvedValue({ ...context(), session: null, contextResult: null });
    const page = await SchoolStudentsPage({ path: ["students"] });
    expect(page.props.children).toBeNull();
    expect(mocks.capabilities).not.toHaveBeenCalled();
    expect(mocks.api).not.toHaveBeenCalled();
  });

  it("no consulta datos cuando el contexto institucional fue rechazado", async () => {
    mocks.context.mockResolvedValue({
      ...context(),
      contextResult: { ok: false, status: 403, problem: { title: "Acceso denegado", status: 403 } },
    });
    const page = await SchoolStudentsPage({ path: ["guardians"] });
    expect(page.props.children).toBeNull();
    expect(mocks.capabilities).not.toHaveBeenCalled();
    expect(mocks.api).not.toHaveBeenCalled();
  });

  it("no consulta directorio ni matrículas sin sus permisos de lectura", async () => {
    mocks.context.mockResolvedValue(context([]));
    const props = workspace(await SchoolStudentsPage({ path: ["students"] }));
    expect(mocks.api).not.toHaveBeenCalled();
    expect(props).toMatchObject({
      canReadStudents: false,
      canReadEnrollments: false,
      canManageStudents: false,
      canManageEnrollments: false,
      directoryAvailable: false,
      enrollmentsAvailable: false,
    });
  });

  it("exige capacidad de lectura aunque el usuario tenga el permiso", async () => {
    mocks.capabilities.mockResolvedValue(capabilities(false, false));
    const props = workspace(await SchoolStudentsPage({ path: ["students"] }));
    expect(mocks.api).not.toHaveBeenCalled();
    expect(props.canReadStudents).toBe(false);
    expect(props.canReadEnrollments).toBe(false);
  });

  it("conserva la consulta histórica y bloquea acciones cuando el módulo es de solo lectura", async () => {
    mocks.capabilities.mockResolvedValue(capabilities(true, false));
    const props = workspace(await SchoolStudentsPage({ path: ["students"] }));
    expect(mocks.api).toHaveBeenCalledWith("/api/tenant/students/overview");
    expect(mocks.api).toHaveBeenCalledWith("/api/tenant/enrollments/overview");
    expect(props).toMatchObject({
      canReadStudents: true,
      canReadEnrollments: true,
      canManageStudents: false,
      canManageEnrollments: false,
      directoryAvailable: true,
      enrollmentsAvailable: true,
    });
  });

  it("conserva el error de capacidades y no consulta datos con autorización desconocida", async () => {
    const problem = { title: "Capacidades no disponibles", status: 503 };
    mocks.capabilities.mockResolvedValue({ ok: false, problem });
    const props = workspace(await SchoolStudentsPage({ path: ["students"] }));
    expect(mocks.api).not.toHaveBeenCalled();
    expect(props.initialProblem).toEqual(problem);
    expect(props.directoryAvailable).toBe(false);
  });

  it("distingue fallo de directorio y datos de matrícula todavía disponibles", async () => {
    const problem = { title: "Directorio no disponible", status: 503 };
    mocks.api.mockImplementation(async (path: string) =>
      path.includes("students") ? { ok: false, problem } : { ok: true, data: enrollments },
    );
    const props = workspace(await SchoolStudentsPage({ path: ["students"] }));
    expect(props).toMatchObject({
      directoryAvailable: false,
      enrollmentsAvailable: true,
      canReadStudents: true,
      initialProblem: problem,
    });
  });

  it("representa un directorio realmente vacío como disponible y sin error", async () => {
    const props = workspace(await SchoolStudentsPage({ path: ["guardians"] }));
    expect(props).toMatchObject({
      directoryAvailable: true,
      enrollmentsAvailable: true,
      initialDirectory: directory,
      initialProblem: null,
    });
  });
});
