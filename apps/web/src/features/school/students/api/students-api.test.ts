import { randomUUID } from "node:crypto";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  activateStudent,
  createGuardian,
  createStudent,
  deactivateStudent,
  enrollStudent,
  fetchEnrollmentsOverview,
  fetchStudentDirectoryOverview,
  linkStudentGuardian,
  transferStudentSection,
  withdrawEnrollment,
} from "./students-api";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("frontera BFF de estudiantes y responsables", () => {
  const studentId = randomUUID();
  const enrollmentId = randomUUID();
  const csrfToken = randomUUID();
  const student = {
    studentCode: "QA-" + randomUUID().slice(0, 8),
    firstName: "Nombre de prueba",
    lastName: "Apellido de prueba",
    birthDate: "2015-01-01",
    sigerdExternalId: null,
  };
  const guardian = {
    fullName: "Responsable de prueba",
    email: "qa@example.invalid",
    phoneNumber: null,
  };
  const link = {
    guardianId: randomUUID(),
    relationshipType: "Tutor legal",
    hasAcademicAccess: false,
    hasFinancialResponsibility: true,
    hasPickupAuthorization: false,
  };
  const enrollment = { studentId, sectionId: randomUUID() };
  const transfer = { targetSectionId: randomUUID() };

  it.each([
    {
      name: "crear expediente",
      path: "tenant/students",
      body: student,
      execute: () => createStudent(student, csrfToken),
    },
    {
      name: "crear responsable",
      path: "tenant/students/guardians",
      body: guardian,
      execute: () => createGuardian(guardian, csrfToken),
    },
    {
      name: "vincular responsable",
      path: `tenant/students/${studentId}/guardians`,
      body: link,
      execute: () => linkStudentGuardian(studentId, link, csrfToken),
    },
    {
      name: "matricular",
      path: "tenant/enrollments",
      body: enrollment,
      execute: () => enrollStudent(enrollment, csrfToken),
    },
    {
      name: "trasladar",
      path: `tenant/enrollments/${enrollmentId}/transfer-section`,
      body: transfer,
      execute: () => transferStudentSection(enrollmentId, transfer, csrfToken),
    },
    {
      name: "retirar",
      path: `tenant/enrollments/${enrollmentId}/withdraw`,
      body: undefined,
      execute: () => withdrawEnrollment(enrollmentId, csrfToken),
    },
    {
      name: "desactivar",
      path: `tenant/students/${studentId}/deactivate`,
      body: undefined,
      execute: () => deactivateStudent(studentId, csrfToken),
    },
    {
      name: "activar",
      path: `tenant/students/${studentId}/activate`,
      body: undefined,
      execute: () => activateStudent(studentId, csrfToken),
    },
  ])(
    "envía $name con CSRF y cookie al mismo origen, sin seleccionar tenant",
    async ({ path, body, execute }) => {
      const fetcher = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
      vi.stubGlobal("fetch", fetcher);

      expect((await execute()).ok).toBe(true);
      const [url, init] = fetcher.mock.calls[0] as [string, RequestInit];
      const headers = new Headers(init.headers);
      expect(url).toBe(`/api/bff/${path}`);
      expect(init.method).toBe("POST");
      expect(init.credentials).toBe("same-origin");
      expect(headers.get("X-CSRF-Token")).toBe(csrfToken);
      expect(headers.has("Authorization")).toBe(false);
      expect(headers.has("X-Tenant-Id")).toBe(false);
      if (body) {
        expect(JSON.parse(String(init.body))).toEqual(body);
        expect(JSON.parse(String(init.body))).not.toHaveProperty("tenantId");
      } else expect(init.body).toBeUndefined();
    },
  );

  it("conserva las restricciones elegidas al vincular, incluidos valores falsos", async () => {
    const fetcher = vi.fn().mockResolvedValue(Response.json({ id: randomUUID() }, { status: 201 }));
    vi.stubGlobal("fetch", fetcher);
    await linkStudentGuardian(studentId, link, csrfToken);
    const payload = JSON.parse(fetcher.mock.calls[0][1].body as string);
    expect(payload.hasAcademicAccess).toBe(false);
    expect(payload.hasFinancialResponsibility).toBe(true);
    expect(payload.hasPickupAuthorization).toBe(false);
  });

  it("codifica un identificador no confiable como un único segmento de ruta", async () => {
    const identifier = "../members?role=admin";
    const fetcher = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetcher);
    await deactivateStudent(identifier, csrfToken);
    const url = new URL(fetcher.mock.calls[0][0] as string, "https://colegio-a.example.invalid");
    expect(url.pathname).toBe(
      `/api/bff/tenant/students/${encodeURIComponent(identifier)}/deactivate`,
    );
    expect(url.search).toBe("");
  });

  it.each([fetchStudentDirectoryOverview, fetchEnrollmentsOverview])(
    "distingue un fallo de lectura de un directorio vacío",
    async (read) => {
      const problem = { title: "Acceso denegado", status: 403, detail: "Sin permiso de consulta." };
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json(problem, { status: 403 })));
      const result = await read();
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.problem).toMatchObject(problem);
      expect(result).not.toHaveProperty("data");
    },
  );

  it("propaga conflicto y errores de campo sin convertirlos en éxito", async () => {
    const problem = {
      title: "Código registrado",
      status: 409,
      errors: { studentCode: ["El código ya existe."] },
    };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json(problem, { status: 409 })));
    const result = await createStudent(student, csrfToken);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.problem).toMatchObject(problem);
  });
});
