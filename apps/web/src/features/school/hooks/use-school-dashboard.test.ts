import { describe, expect, it } from "vitest";
import { deriveSchoolDashboard, type SchoolDashboardData } from "./use-school-dashboard";
import type {
  AcademicYearDto,
  SectionCapacitySnapshotDto,
  StudentDto,
  StudentEnrollmentDto,
} from "@/lib/api/types";

function academicYear(id: string, startDate: string): AcademicYearDto {
  return {
    id,
    code: id,
    name: id,
    startDate,
    endDate: "2027-06-30",
    isClosed: false,
    sectionsCount: 0,
    createdAtUtc: startDate + "T00:00:00Z",
  };
}
function student(id: string, isActive = true): StudentDto {
  return {
    id,
    studentCode: id,
    firstName: "Nombre",
    lastName: "Apellido",
    fullName: "Nombre Apellido",
    birthDate: "2015-01-01",
    sigerdExternalId: null,
    isActive,
    guardians: [],
    latestEnrollment: null,
    createdAtUtc: "2026-01-01T00:00:00Z",
  };
}
function enrollment(
  studentId: string,
  academicYearId: string,
  status: StudentEnrollmentDto["status"],
  enrolledAtUtc: string,
): StudentEnrollmentDto {
  return {
    id: studentId + academicYearId,
    studentId,
    studentCode: studentId,
    studentFullName: "Nombre Apellido",
    sigerdExternalId: null,
    academicYearId,
    academicYearCode: academicYearId,
    sectionId: "section",
    sectionCode: "A",
    gradeLevelCode: "grade",
    gradeLevelName: "Grado",
    shift: "Morning",
    status,
    enrolledAtUtc,
  };
}
function section(
  sectionId: string,
  academicYearId: string,
  capacity: number,
  active: number,
): SectionCapacitySnapshotDto {
  return {
    sectionId,
    academicYearId,
    academicYearCode: academicYearId,
    isAcademicYearClosed: false,
    gradeLevelId: "grade",
    gradeLevelCode: "grade",
    gradeLevelName: "Grado",
    sectionCode: sectionId,
    shift: "Morning",
    capacity,
    activeEnrollmentsCount: active,
    availableSeats: Math.max(0, capacity - active),
  };
}
function dashboard(overrides: Partial<SchoolDashboardData> = {}): SchoolDashboardData {
  return {
    name: "Usuario de prueba",
    institutionStatus: "Active",
    academic: {
      academicYears: [
        academicYear("current", "2026-08-01"),
        academicYear("previous", "2025-08-01"),
      ],
    },
    directory: { students: [] },
    enrollments: { enrollments: [], sectionCapacities: [] },
    capabilities: null,
    permissions: [],
    problems: [],
    ...overrides,
  };
}

describe("resumen escolar derivado", () => {
  it("distingue un resultado vacío de una fuente no disponible", () => {
    const empty = deriveSchoolDashboard(dashboard(), "current");
    expect(empty.activeStudentsCount).toBe(0);
    expect(empty.activeEnrollmentsCount).toBe(0);
    expect(empty.enabledSectionsCount).toBe(0);
    expect(empty.availableSeatsCount).toBe(0);
    const unavailable = deriveSchoolDashboard(
      dashboard({ directory: null, enrollments: null }),
      "current",
    );
    expect(unavailable.activeStudentsCount).toBeNull();
    expect(unavailable.activeEnrollmentsCount).toBeNull();
    expect(unavailable.enabledSectionsCount).toBeNull();
    expect(unavailable.availableSeatsCount).toBeNull();
    expect(unavailable.canReviewStudents).toBe(false);
  });

  it("filtra matrículas vigentes y cupos por el año seleccionado", () => {
    const data = dashboard({
      directory: {
        students: [student("enrolled"), student("waiting"), student("inactive", false)],
      },
      enrollments: {
        enrollments: [
          enrollment("enrolled", "current", "Active", "2026-08-10T00:00:00Z"),
          enrollment("waiting", "previous", "Active", "2025-08-10T00:00:00Z"),
          enrollment("withdrawn", "current", "Withdrawn", "2026-09-10T00:00:00Z"),
        ],
        sectionCapacities: [
          section("a", "current", 20, 19),
          section("b", "current", 20, 20),
          section("c", "previous", 80, 0),
        ],
      },
    });
    const summary = deriveSchoolDashboard(data, "current");
    expect(summary.activeStudentsCount).toBe(2);
    expect(summary.activeEnrollmentsCount).toBe(1);
    expect(summary.enabledSectionsCount).toBe(2);
    expect(summary.availableSeatsCount).toBe(1);
    expect(summary.unassigned.map((item) => item.id)).toEqual(["waiting"]);
    expect(summary.atCapacityCount).toBe(1);
    expect(summary.canReviewStudents).toBe(true);
  });

  it("cuenta registros mensuales reales durante doce meses incluso al cruzar diciembre", () => {
    const summary = deriveSchoolDashboard(
      dashboard({
        enrollments: {
          enrollments: [
            enrollment("first", "current", "Active", "2026-08-10T00:00:00Z"),
            enrollment("second", "current", "Withdrawn", "2027-01-10T00:00:00Z"),
            enrollment("old", "previous", "Active", "2026-08-10T00:00:00Z"),
          ],
          sectionCapacities: [],
        },
      }),
      "current",
    );
    expect(summary.chart).toHaveLength(12);
    expect(summary.chart[0].key).toBe("2026-08");
    expect(summary.chart[11].key).toBe("2027-07");
    expect(summary.chart.find((month) => month.key === "2026-08")?.count).toBe(1);
    expect(summary.chart.find((month) => month.key === "2027-01")?.count).toBe(1);
    expect(summary.chart.reduce((sum, month) => sum + month.count, 0)).toBe(2);
    expect(summary.hasEnrollments).toBe(true);
  });

  it("no inventa un año ni un gráfico cuando la selección no existe", () => {
    const summary = deriveSchoolDashboard(dashboard(), "missing");
    expect(summary.chart).toEqual([]);
    expect(summary.activeEnrollmentsCount).toBeNull();
    expect(summary.availableSeatsCount).toBeNull();
    expect(summary.hasEnrollments).toBe(false);
    expect(summary.canReviewStudents).toBe(false);
  });

  it.each([
    [false, false, false],
    [true, false, false],
    [false, true, false],
    [true, true, true],
  ])(
    "exige permiso=%s y escritura comercial=%s para ofrecer mutaciones",
    (permission, writable, expected) => {
      const summary = deriveSchoolDashboard(
        dashboard({
          permissions: permission
            ? ["institution.enrollments.manage", "institution.academic.manage"]
            : [],
          capabilities: {
            status: "Active",
            endsAtUtc: null,
            maxActiveStudents: null,
            maxSections: null,
            modules: ["enrollments", "academic"].map((code) => ({
              code,
              name: code,
              canRead: true,
              canWrite: writable,
              reason: null,
            })),
          },
        }),
        "current",
      );
      expect(summary.canEnroll).toBe(expected);
      expect(summary.canOrganize).toBe(expected);
    },
  );
});
