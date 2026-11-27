import type {
  AcademicYearDto,
  StudentDto,
  SectionCapacitySnapshotDto,
  StudentEnrollmentDto,
  ProblemDetails,
} from "@/lib/api/types";

export type EnrollmentYear = Pick<AcademicYearDto, "id" | "code" | "isClosed">;
export type EnrollmentStudent = Pick<
  StudentDto,
  "id" | "studentCode" | "fullName" | "sigerdExternalId" | "isActive"
>;
export type EnrollmentSection = Pick<
  SectionCapacitySnapshotDto,
  | "sectionId"
  | "academicYearId"
  | "academicYearCode"
  | "isAcademicYearClosed"
  | "gradeLevelName"
  | "sectionCode"
  | "shift"
  | "capacity"
  | "activeEnrollmentsCount"
  | "availableSeats"
>;
export type EnrollmentRecord = Pick<
  StudentEnrollmentDto,
  | "id"
  | "studentId"
  | "studentCode"
  | "studentFullName"
  | "academicYearId"
  | "sectionId"
  | "status"
  | "enrolledAtUtc"
>;
export interface EnrollmentOverview {
  enrollments: EnrollmentRecord[];
  sectionCapacities: EnrollmentSection[];
}
export interface EnrollmentProblem {
  source: "capabilities" | "academic" | "enrollments" | "students";
  problem: ProblemDetails;
}
export interface EnrollmentsWorkspaceData {
  years: EnrollmentYear[] | null;
  students: EnrollmentStudent[] | null;
  overview: EnrollmentOverview | null;
  problems: EnrollmentProblem[];
  canReadEnrollments: boolean;
  canManageEnrollments: boolean;
  canReadStudents: boolean;
  csrfToken: string;
}
