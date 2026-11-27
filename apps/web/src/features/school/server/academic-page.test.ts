import { randomUUID } from "node:crypto";
import type { ReactElement } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SchoolAcademicPage } from "./academic-page";

const mocks = vi.hoisted(() => ({ context: vi.fn(), capabilities: vi.fn(), api: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("./school-context", () => ({
  getSchoolContext: mocks.context,
  getSchoolCapabilities: mocks.capabilities,
  schoolViewKey: () => "vista-de-prueba",
}));
vi.mock("@/lib/api/server-api", () => ({ serverApiFetch: mocks.api }));
vi.mock("@/components/school/school-page-access", () => ({ SchoolPageAccess: () => null }));
vi.mock("@/features/school/academic/components/academic-workspace", () => ({
  AcademicWorkspace: () => null,
}));

const permissions = [
  "institution.academic.read",
  "institution.academic.manage",
  "institution.members.read",
];
const overview = {
  academicYears: [],
  gradeLevels: [],
  sections: [],
  subjects: [],
  teacherAssignments: [],
};
const member = {
  membershipId: randomUUID(),
  userId: randomUUID(),
  displayName: "Persona de prueba",
  email: "qa@example.invalid",
  status: "Active",
  roles: ["InstitutionAdmin"],
  createdAt: "2026-08-01T00:00:00Z",
};
function context(permitted = permissions) {
  return {
    session: { csrfToken: randomUUID() },
    contextResult: { ok: true, data: { permissions: permitted } },
    rawHost: "colegio-a.localhost:3101",
    slug: "colegio-a",
  };
}
function capabilities(canRead = true, canWrite = true) {
  return { ok: true, data: { modules: [{ code: "academic", canRead, canWrite }] } };
}
function workspace(page: ReactElement<{ children: ReactElement<Record<string, unknown>> | null }>) {
  if (!page.props.children) throw new Error("Se esperaba una vista escolar autenticada.");
  return page.props.children.props;
}
beforeEach(() => {
  vi.clearAllMocks();
  mocks.context.mockResolvedValue(context());
  mocks.capabilities.mockResolvedValue(capabilities());
  mocks.api.mockImplementation(async (path: string) => ({
    ok: true,
    data: path.includes("members") ? [member] : overview,
  }));
});

describe("autorización y disponibilidad de la carga académica", () => {
  it("no consulta datos ni capacidades sin sesión", async () => {
    mocks.context.mockResolvedValue({ ...context(), session: null, contextResult: null });
    expect((await SchoolAcademicPage()).props.children).toBeNull();
    expect(mocks.api).not.toHaveBeenCalled();
    expect(mocks.capabilities).not.toHaveBeenCalled();
  });
  it("no consulta datos con un contexto institucional rechazado", async () => {
    mocks.context.mockResolvedValue({
      ...context(),
      contextResult: { ok: false, problem: { status: 403, title: "Sin acceso" } },
    });
    expect((await SchoolAcademicPage()).props.children).toBeNull();
    expect(mocks.api).not.toHaveBeenCalled();
  });
  it("exige permiso académico aunque se pueda consultar miembros", async () => {
    mocks.context.mockResolvedValue(context(["institution.members.read"]));
    const props = workspace(await SchoolAcademicPage());
    expect(mocks.api).not.toHaveBeenCalled();
    expect(props).toMatchObject({
      canReadAcademic: false,
      overviewAvailable: false,
      canManageAcademic: false,
    });
  });
  it("exige capacidad de lectura además del permiso", async () => {
    mocks.capabilities.mockResolvedValue(capabilities(false, false));
    const props = workspace(await SchoolAcademicPage());
    expect(mocks.api).not.toHaveBeenCalled();
    expect(props.canReadAcademic).toBe(false);
  });
  it("conserva lectura histórica sin ofrecer gestión cuando canWrite es falso", async () => {
    mocks.capabilities.mockResolvedValue(capabilities(true, false));
    const props = workspace(await SchoolAcademicPage());
    expect(mocks.api).toHaveBeenCalledWith("/api/tenant/academic/overview");
    expect(props).toMatchObject({
      canReadAcademic: true,
      overviewAvailable: true,
      canManageAcademic: false,
    });
  });
  it("no consulta miembros sin su permiso ni interpreta la falta de acceso como catálogo vacío", async () => {
    mocks.context.mockResolvedValue(context(["institution.academic.read"]));
    const props = workspace(await SchoolAcademicPage());
    expect(mocks.api).not.toHaveBeenCalledWith("/api/tenant/members");
    expect(props).toMatchObject({ canReadMembers: false, membersAvailable: false });
  });
  it("preserva un error de capacidades sin consultar con autorización desconocida", async () => {
    const problem = { title: "Capacidades no disponibles", status: 503 };
    mocks.capabilities.mockResolvedValue({ ok: false, problem });
    const props = workspace(await SchoolAcademicPage());
    expect(mocks.api).not.toHaveBeenCalled();
    expect(props).toMatchObject({ initialProblem: problem, overviewAvailable: false });
  });
  it("distingue error académico de una estructura realmente vacía", async () => {
    const problem = { title: "Estructura no disponible", status: 503 };
    mocks.api.mockResolvedValue({ ok: false, problem });
    expect(workspace(await SchoolAcademicPage())).toMatchObject({
      initialProblem: problem,
      overviewAvailable: false,
    });
    mocks.api.mockResolvedValue({ ok: true, data: overview });
    const props = workspace(await SchoolAcademicPage());
    expect(props).toMatchObject({
      overviewAvailable: true,
      initialOverview: overview,
      initialProblem: null,
    });
  });
  it("proyecta sólo los datos necesarios de miembros sin identificador de cuenta ni roles", async () => {
    const props = workspace(await SchoolAcademicPage({ path: ["academic", "assignments"] }));
    expect(props.members).toEqual([
      { membershipId: member.membershipId, displayName: member.displayName, status: member.status },
    ]);
  });

  it("no consulta miembros en pantallas que no necesitan asignación docente", async () => {
    await SchoolAcademicPage({ path: ["academic", "years"] });
    expect(mocks.api).not.toHaveBeenCalledWith("/api/tenant/members");
  });

  it("no inventa ocupación cero cuando no se puede leer matrículas", async () => {
    const props = workspace(await SchoolAcademicPage({ path: ["academic", "grades"] }));
    expect(mocks.api).not.toHaveBeenCalledWith("/api/tenant/enrollments/overview");
    expect(props.initialSectionCapacities).toBeNull();
    expect(props.canReadEnrollments).toBe(false);
  });

  it("proyecta sólo capacidad y ocupación sin distribuir datos de estudiantes", async () => {
    const sectionId = randomUUID();
    mocks.context.mockResolvedValue(context([...permissions, "institution.enrollments.read"]));
    mocks.capabilities.mockResolvedValue({
      ok: true,
      data: {
        modules: [
          { code: "academic", canRead: true, canWrite: true },
          { code: "enrollments", canRead: true, canWrite: true },
        ],
      },
    });
    mocks.api.mockImplementation(async (path: string) => ({
      ok: true,
      data: path.includes("enrollments")
        ? {
            enrollments: [{ studentFullName: "Dato personal innecesario" }],
            sectionCapacities: [
              {
                sectionId,
                capacity: 20,
                activeEnrollmentsCount: 2,
                availableSeats: 18,
                academicYearId: randomUUID(),
              },
            ],
          }
        : overview,
    }));
    const props = workspace(await SchoolAcademicPage({ path: ["academic", "grades"] }));
    expect(props.initialSectionCapacities).toEqual([
      { sectionId, capacity: 20, activeEnrollmentsCount: 2 },
    ]);
    expect(JSON.stringify(props)).not.toContain("Dato personal innecesario");
    expect(mocks.api).not.toHaveBeenCalledWith("/api/tenant/members");
  });
});
