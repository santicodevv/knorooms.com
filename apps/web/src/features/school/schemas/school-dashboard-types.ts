import type {
  AcademicYearDto,
  StudentDto,
  StudentEnrollmentDto,
  SectionCapacitySnapshotDto,
  InstitutionStatus,
  ProblemDetails,
} from "@/lib/api/types";
import type { EffectiveAccess } from "@/features/subscriptions/schemas/subscription-schemas";

export type SchoolDashboardYear = Pick<AcademicYearDto, "id" | "code" | "startDate" | "isClosed">;
export type SchoolDashboardSection = Pick<
  SectionCapacitySnapshotDto,
  | "sectionId"
  | "academicYearId"
  | "gradeLevelName"
  | "sectionCode"
  | "capacity"
  | "activeEnrollmentsCount"
  | "availableSeats"
>;
export interface SchoolDashboardProblem {
  source: "academic" | "directory" | "enrollments" | "capabilities";
  problem: ProblemDetails;
}
export interface SchoolDashboardData {
  name: string;
  institutionStatus: InstitutionStatus;
  academic: { academicYears: SchoolDashboardYear[] } | null;
  directory: { students: Pick<StudentDto, "id" | "isActive">[] } | null;
  enrollments: {
    enrollments: Pick<
      StudentEnrollmentDto,
      "studentId" | "academicYearId" | "status" | "enrolledAtUtc"
    >[];
    sectionCapacities: SchoolDashboardSection[];
  } | null;
  capabilities: EffectiveAccess | null;
  permissions: string[];
  problems: SchoolDashboardProblem[];
}
