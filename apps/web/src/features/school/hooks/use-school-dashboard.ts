"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { SchoolDashboardData } from "../schemas/school-dashboard-types";
export type {
  SchoolDashboardData,
  SchoolDashboardProblem,
} from "../schemas/school-dashboard-types";
export function deriveSchoolDashboard(data: SchoolDashboardData, year: string) {
  const yearData = data.academic?.academicYears.find((item) => item.id === year);
  const sections = yearData
    ? (data.enrollments?.sectionCapacities.filter((item) => item.academicYearId === year) ?? [])
    : [];
  const enrollments = yearData
    ? (data.enrollments?.enrollments.filter((item) => item.academicYearId === year) ?? [])
    : [];
  const active = enrollments.filter((item) => item.status === "Active");
  const unassigned =
    data.directory?.students.filter(
      (student) => student.isActive && !active.some((item) => item.studentId === student.id),
    ) ?? [];
  const start = yearData ? new Date(yearData.startDate + "T12:00:00Z") : null;
  const chart =
    start && Number.isFinite(start.getTime())
      ? Array.from({ length: 12 }, (_, index) => {
          const date = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + index, 1));
          const key = date.getUTCFullYear() + "-" + String(date.getUTCMonth() + 1).padStart(2, "0");
          return {
            key,
            label: date.toLocaleDateString("es-DO", { month: "short", timeZone: "UTC" }),
            count: enrollments.filter((item) => item.enrolledAtUtc.startsWith(key)).length,
          };
        })
      : [];
  const canRead = (module: string) =>
    data.capabilities?.modules.some((item) => item.code === module && item.canRead) === true;
  const canWrite = (module: string) =>
    data.capabilities?.modules.some((item) => item.code === module && item.canWrite) === true;
  const hasPermission = (permission: string) => data.permissions.includes(permission);
  const enrollmentSummaryAvailable = data.enrollments !== null && yearData !== undefined;
  return {
    yearData,
    sections,
    active,
    unassigned,
    chart,
    hasEnrollments: chart.some((item) => item.count > 0),
    atCapacityCount: sections.filter(
      (item) => item.capacity > 0 && item.activeEnrollmentsCount / item.capacity > 0.95,
    ).length,
    enrollmentSummaryAvailable,
    activeStudentsCount: data.directory
      ? data.directory.students.filter((item) => item.isActive).length
      : null,
    activeEnrollmentsCount: enrollmentSummaryAvailable ? active.length : null,
    enabledSectionsCount: enrollmentSummaryAvailable ? sections.length : null,
    availableSeatsCount: enrollmentSummaryAvailable
      ? sections.reduce((total, section) => total + section.availableSeats, 0)
      : null,
    canRead,
    canWrite,
    hasPermission,
    canEnroll: hasPermission("institution.enrollments.manage") && canWrite("enrollments"),
    canOrganize: hasPermission("institution.academic.manage") && canWrite("academic"),
    canReviewStudents: data.directory !== null && enrollmentSummaryAvailable,
  };
}
export function useSchoolDashboard(data: SchoolDashboardData) {
  const router = useRouter();
  const [refreshing, startTransition] = useTransition();
  const [year, setYear] = useState(
    data.academic?.academicYears.find((item) => !item.isClosed)?.id ??
      data.academic?.academicYears[0]?.id ??
      "",
  );
  function refresh() {
    startTransition(() => router.refresh());
  }
  return { year, setYear, refreshing, refresh, ...deriveSchoolDashboard(data, year) };
}
