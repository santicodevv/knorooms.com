import type {
  EnrollmentYear,
  EnrollmentSection,
  EnrollmentStudent,
  EnrollmentRecord,
} from "./enrollment-types";

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es")
    .trim();
}

export function deriveEnrollmentYears(
  years: readonly EnrollmentYear[] | null,
  sections: readonly EnrollmentSection[],
): EnrollmentYear[] {
  if (years !== null) return [...years];
  return [
    ...new Map(
      sections.map((section) => [
        section.academicYearId,
        {
          id: section.academicYearId,
          code: section.academicYearCode,
          isClosed: section.isAcademicYearClosed,
        },
      ]),
    ).values(),
  ];
}
export function selectEnrollmentSections(sections: readonly EnrollmentSection[], yearId: string) {
  return sections.filter((section) => section.academicYearId === yearId);
}
export function selectEligibleEnrollmentStudents(
  students: readonly EnrollmentStudent[],
  enrollments: readonly EnrollmentRecord[],
  yearId: string,
) {
  const enrolled = new Set(
    enrollments
      .filter((enrollment) => enrollment.academicYearId === yearId)
      .map((enrollment) => enrollment.studentId),
  );
  return yearId ? students.filter((student) => student.isActive && !enrolled.has(student.id)) : [];
}
export function selectAvailableEnrollmentSections(
  sections: readonly EnrollmentSection[],
  yearId: string,
) {
  return selectEnrollmentSections(sections, yearId).filter(
    (section) => !section.isAcademicYearClosed && section.availableSeats > 0,
  );
}
export function selectSectionEnrollments(
  enrollments: readonly EnrollmentRecord[],
  sectionId: string,
  query: string,
) {
  const search = normalize(query);
  return enrollments.filter(
    (enrollment) =>
      enrollment.sectionId === sectionId &&
      enrollment.status === "Active" &&
      (!search ||
        normalize(enrollment.studentFullName).includes(search) ||
        normalize(enrollment.studentCode).includes(search)),
  );
}
export function enrollmentStudentLabel(student: EnrollmentStudent) {
  return `${student.fullName} · ${student.studentCode}${student.sigerdExternalId ? ` · ${student.sigerdExternalId}` : ""}`;
}
export function enrollmentSectionLabel(section: EnrollmentSection) {
  return `${section.gradeLevelName} ${section.sectionCode}`;
}
export function enrollmentDateLabel(value: string) {
  return new Date(value).toLocaleDateString("es-DO", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}
