import { randomUUID } from "node:crypto";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { StudentDto, StudentEnrollmentDto } from "@/lib/api/types";
import { useStudentsWorkspace } from "../hooks/use-students-workspace";
import { StudentProfileSummary } from "./student-profile-summary";
import { StudentProfileGuardians } from "./student-profile-guardians";
import { StudentProfileEnrollments } from "./student-profile-enrollments";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

function student(overrides: Partial<StudentDto> = {}): StudentDto {
  return {
    id: randomUUID(),
    studentCode: "QA-" + randomUUID().slice(0, 8),
    firstName: "Nombre QA",
    lastName: "Apellido QA",
    fullName: "Nombre Apellido QA",
    birthDate: "2015-01-01",
    sigerdExternalId: null,
    isActive: true,
    guardians: [],
    latestEnrollment: null,
    createdAtUtc: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}
function enrollment(
  target: StudentDto,
  overrides: Partial<StudentEnrollmentDto> = {},
): StudentEnrollmentDto {
  return {
    id: randomUUID(),
    studentId: target.id,
    studentCode: target.studentCode,
    studentFullName: target.fullName,
    sigerdExternalId: null,
    academicYearId: randomUUID(),
    academicYearCode: "AÑO-QA",
    sectionId: randomUUID(),
    sectionCode: "SECCIÓN-QA",
    gradeLevelCode: "QA-GRADE",
    gradeLevelName: "Grado QA",
    shift: "Morning",
    status: "Active",
    enrolledAtUtc: "2026-09-01T00:00:00Z",
    ...overrides,
  };
}
function ProfileHarness({
  target,
  rows = [],
  available = true,
  canRead = true,
  canManage = false,
  guardians = false,
}: {
  target: StudentDto;
  rows?: StudentEnrollmentDto[];
  available?: boolean;
  canRead?: boolean;
  canManage?: boolean;
  guardians?: boolean;
}) {
  const state = useStudentsWorkspace({
    initialDirectory: { students: [target], guardians: [] },
    initialEnrollments: { enrollments: rows, sectionCapacities: [] },
    initialProblem: null,
    csrfToken: randomUUID(),
    studentId: target.id,
    canReadStudents: true,
    canReadEnrollments: canRead,
    directoryAvailable: true,
    enrollmentsAvailable: available,
  });
  return createElement(guardians ? StudentProfileGuardians : StudentProfileEnrollments, {
    state,
    canManage,
  });
}

describe("estados y autorizaciones de la ficha", () => {
  it.each([
    [false, false, "Sin permiso para consultar matrículas"],
    [false, true, "Información de matrículas no disponible"],
    [true, true, "Sin matrículas registradas"],
  ])("distingue disponibilidad=%s y lectura=%s", (available, canRead, title) => {
    const markup = renderToStaticMarkup(
      createElement(ProfileHarness, { target: student(), available, canRead }),
    );
    expect(markup).toContain(title);
    expect(markup).not.toContain("Trasladar");
    expect(markup).not.toContain("Retirar");
    expect(markup).not.toContain("Matricular estudiante");
  });

  it("oculta cambios de matrícula con lectura sin autorización de gestión", () => {
    const target = student();
    const markup = renderToStaticMarkup(
      createElement(ProfileHarness, { target, rows: [enrollment(target)] }),
    );
    expect(markup).toContain("AÑO-QA");
    expect(markup).not.toContain("Trasladar");
    expect(markup).not.toContain("Retirar");
    expect(markup).not.toContain("Matricular estudiante");
  });

  it("ofrece traslado y retiro sólo para matrículas activas del expediente seleccionado", () => {
    const target = student();
    const foreign = student({ fullName: "Otro expediente QA" });
    const active = renderToStaticMarkup(
      createElement(ProfileHarness, {
        target,
        rows: [enrollment(target), enrollment(foreign, { academicYearCode: "AÑO-AJENO" })],
        canManage: true,
      }),
    );
    expect(active).toContain("Trasladar");
    expect(active).toContain("Retirar");
    expect(active).not.toContain("AÑO-AJENO");
    const withdrawn = renderToStaticMarkup(
      createElement(ProfileHarness, {
        target,
        rows: [enrollment(target, { status: "Withdrawn" })],
        canManage: true,
      }),
    );
    expect(withdrawn).not.toContain(">Trasladar<");
    expect(withdrawn).not.toContain(">Retirar<");
  });

  it("no ofrece matricular un expediente inactivo", () => {
    const markup = renderToStaticMarkup(
      createElement(ProfileHarness, { target: student({ isActive: false }), canManage: true }),
    );
    expect(markup).not.toContain("Matricular estudiante");
  });

  it("conserva acciones de una matrícula vigente cuando el expediente está inactivo", () => {
    const target = student({ isActive: false });
    const markup = renderToStaticMarkup(
      createElement(ProfileHarness, { target, rows: [enrollment(target)], canManage: true }),
    );
    expect(markup).toContain(">Trasladar<");
    expect(markup).toContain(">Retirar<");
    expect(markup).not.toContain("Matricular estudiante");
  });

  it("presenta únicamente las autorizaciones reales de un vínculo familiar", () => {
    const target = student({
      guardians: [
        {
          linkId: randomUUID(),
          guardianId: randomUUID(),
          fullName: "Responsable QA",
          email: "qa@example.invalid",
          phoneNumber: null,
          relationshipType: "Tutor legal",
          hasAcademicAccess: false,
          hasFinancialResponsibility: true,
          hasPickupAuthorization: false,
        },
      ],
    });
    const markup = renderToStaticMarkup(createElement(ProfileHarness, { target, guardians: true }));
    expect(markup).toContain("Responsabilidad financiera");
    expect(markup).not.toContain("Acceso académico");
    expect(markup).not.toContain("Recogida autorizada");
    expect(markup).not.toContain("Vincular responsable");
    expect(markup).not.toContain("Nuevo responsable");
  });

  it("representa datos ausentes de resumen sin inventar identificación ni matrícula", () => {
    const markup = renderToStaticMarkup(
      createElement(StudentProfileSummary, { student: student() }),
    );
    expect(markup).toContain("No registrado");
    expect(markup).toContain("Sin matrícula vigente");
  });

  it("escapa texto de expediente suministrado por el servidor", () => {
    const markup = renderToStaticMarkup(
      createElement(StudentProfileSummary, {
        student: student({ fullName: '<script>alert("qa")</script>' }),
      }),
    );
    expect(markup).not.toContain("<script>");
    expect(markup).toContain("&lt;script&gt;");
  });
});
