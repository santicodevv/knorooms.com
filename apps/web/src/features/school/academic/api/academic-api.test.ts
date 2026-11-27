import { randomUUID } from "node:crypto";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  assignTeacher,
  closeAcademicYear,
  createAcademicYear,
  createGradeLevel,
  createSchoolSection,
  createSubject,
  fetchAcademicOverview,
  reopenAcademicYear,
} from "./academic-api";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("contratos BFF de organización académica", () => {
  const csrf = randomUUID();
  const yearId = randomUUID();
  const year = {
    code: "QA-" + randomUUID().slice(0, 8),
    name: "Año de prueba",
    startDate: "2026-08-01",
    endDate: "2027-06-30",
  };
  const grade = {
    stage: "Primary" as const,
    officialGradeNumber: 1,
    code: "QA-P1",
    displayName: "Primero de prueba",
  };
  const section = {
    academicYearId: yearId,
    gradeLevelId: randomUUID(),
    code: "QA-A",
    shift: "Morning" as const,
    capacity: 20,
  };
  const subject = { code: "QA-MAT", name: "Materia de prueba" };
  const assignment = {
    sectionId: randomUUID(),
    subjectId: randomUUID(),
    teacherMembershipId: randomUUID(),
    weeklyHours: 4,
  };

  it.each([
    {
      label: "crear año",
      path: "years",
      body: year,
      execute: () => createAcademicYear(year, csrf),
    },
    {
      label: "registrar grado",
      path: "grade-levels",
      body: grade,
      execute: () => createGradeLevel(grade, csrf),
    },
    {
      label: "crear sección",
      path: "sections",
      body: section,
      execute: () => createSchoolSection(section, csrf),
    },
    {
      label: "registrar materia",
      path: "subjects",
      body: subject,
      execute: () => createSubject(subject, csrf),
    },
    {
      label: "asignar docente",
      path: "teacher-assignments",
      body: assignment,
      execute: () => assignTeacher(assignment, csrf),
    },
    {
      label: "cerrar año",
      path: `years/${yearId}/close`,
      body: undefined,
      execute: () => closeAcademicYear(yearId, csrf),
    },
    {
      label: "reabrir año",
      path: `years/${yearId}/reopen`,
      body: undefined,
      execute: () => reopenAcademicYear(yearId, csrf),
    },
  ])(
    "envía $label por BFF con CSRF sin seleccionar institución",
    async ({ path, body, execute }) => {
      const fetcher = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
      vi.stubGlobal("fetch", fetcher);
      expect((await execute()).ok).toBe(true);
      const [url, init] = fetcher.mock.calls[0] as [string, RequestInit];
      const headers = new Headers(init.headers);
      expect(url).toBe(`/api/bff/tenant/academic/${path}`);
      expect(init.method).toBe("POST");
      expect(init.credentials).toBe("same-origin");
      expect(headers.get("X-CSRF-Token")).toBe(csrf);
      expect(headers.has("Authorization")).toBe(false);
      expect(headers.has("X-Tenant-Id")).toBe(false);
      if (body) {
        expect(JSON.parse(String(init.body))).toEqual(body);
        expect(JSON.parse(String(init.body))).not.toHaveProperty("tenantId");
      } else expect(init.body).toBeUndefined();
    },
  );

  it.each([closeAcademicYear, reopenAcademicYear])(
    "codifica el identificador del año como un solo segmento",
    async (execute) => {
      const identifier = "../members?role=admin";
      const fetcher = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
      vi.stubGlobal("fetch", fetcher);
      await execute(identifier, csrf);
      const url = new URL(fetcher.mock.calls[0][0] as string, "https://colegio-a.example.invalid");
      expect(url.pathname).toContain(`/years/${encodeURIComponent(identifier)}/`);
      expect(url.search).toBe("");
    },
  );

  it("distingue la estructura vacía de un error de lectura", async () => {
    const empty = {
      academicYears: [],
      gradeLevels: [],
      sections: [],
      subjects: [],
      teacherAssignments: [],
    };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json(empty)));
    expect(await fetchAcademicOverview()).toMatchObject({ ok: true, data: empty });
    const problem = { title: "Consulta no autorizada", status: 403 };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json(problem, { status: 403 })));
    const denied = await fetchAcademicOverview();
    expect(denied).toMatchObject({ ok: false, problem });
    expect(denied).not.toHaveProperty("data");
  });

  it("preserva los conflictos y errores de campo del servidor", async () => {
    const problem = {
      title: "Asignación registrada",
      status: 409,
      errors: { subjectId: ["La materia ya tiene docente en esta sección."] },
    };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json(problem, { status: 409 })));
    expect(await assignTeacher(assignment, csrf)).toMatchObject({ ok: false, problem });
  });
});
