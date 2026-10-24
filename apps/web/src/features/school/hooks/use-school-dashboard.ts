"use client";
import { useState } from "react";
import type {
  AcademicStructureOverviewDto,
  StudentDirectoryOverviewDto,
  EnrollmentsOverviewDto,
} from "@/lib/api/types";
export interface SchoolDashboardData {
  name: string;
  academic: AcademicStructureOverviewDto | null;
  directory: StudentDirectoryOverviewDto | null;
  enrollments: EnrollmentsOverviewDto | null;
  permissions: string[];
}
export function useSchoolDashboard(data: SchoolDashboardData) {
  const [year, setYear] = useState(
    data.academic?.academicYears.find((y) => !y.isClosed)?.id ??
      data.academic?.academicYears[0]?.id ??
      "",
  );
  const sections =
    data.enrollments?.sectionCapacities.filter((s) => !year || s.academicYearId === year) ?? [];
  const enrollments =
    data.enrollments?.enrollments.filter((e) => !year || e.academicYearId === year) ?? [];
  const active = enrollments.filter((e) => e.status === "Active");
  const unassigned =
    data.directory?.students.filter(
      (s) => s.isActive && !active.some((e) => e.studentId === s.id),
    ) ?? [];
  const yearData = data.academic?.academicYears.find((y) => y.id === year);
  const chart = Array.from({ length: 12 }, (_, i) => {
    const start = yearData?.startDate ? new Date(yearData.startDate + "T12:00:00Z") : new Date();
    const d = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + i, 1));
    return {
      key: d.getUTCFullYear() + "-" + String(d.getUTCMonth() + 1).padStart(2, "0"),
      label: d.toLocaleDateString("es-DO", { month: "short", timeZone: "UTC" }),
      count: enrollments.filter((e) =>
        e.enrolledAtUtc.startsWith(
          d.getUTCFullYear() + "-" + String(d.getUTCMonth() + 1).padStart(2, "0"),
        ),
      ).length,
    };
  });
  return { year, setYear, sections, active, unassigned, chart, yearData };
}
