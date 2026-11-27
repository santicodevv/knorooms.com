import type { GuardianDto, StudentDto } from "@/lib/api/types";

export type StudentStatusFilter = "all" | "active" | "inactive" | "unassigned";
const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es")
    .trim();
export function filterStudents(
  students: readonly StudentDto[],
  query: string,
  status: StudentStatusFilter,
) {
  const search = normalize(query);
  return students.filter((student) => {
    if (status === "active" && !student.isActive) return false;
    if (status === "inactive" && student.isActive) return false;
    if (status === "unassigned" && student.latestEnrollment?.status === "Active") return false;
    return (
      !search ||
      [student.fullName, student.studentCode, student.sigerdExternalId ?? ""].some((value) =>
        normalize(value).includes(search),
      )
    );
  });
}
export function filterGuardians(guardians: readonly GuardianDto[], query: string) {
  const search = normalize(query);
  return guardians.filter(
    (guardian) =>
      !search ||
      normalize(guardian.fullName).includes(search) ||
      normalize(guardian.email).includes(search),
  );
}
export function linkedGuardianStudents(students: readonly StudentDto[], guardianId: string) {
  return students.filter((student) =>
    student.guardians.some((link) => link.guardianId === guardianId),
  );
}
export function paginateRecords<T>(rows: readonly T[], page: number, size = 10) {
  const safeSize = Number.isFinite(size) ? Math.max(1, Math.floor(size)) : 10;
  const pages = Math.max(1, Math.ceil(rows.length / safeSize));
  const current = Number.isFinite(page) ? Math.max(1, Math.min(pages, Math.floor(page))) : 1;
  return {
    rows: rows.slice((current - 1) * safeSize, current * safeSize),
    page: current,
    pages,
    total: rows.length,
  };
}

export function studentInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}
export function formatStudentDate(value: string) {
  return new Date(value + "T12:00:00Z").toLocaleDateString("es-DO", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}
