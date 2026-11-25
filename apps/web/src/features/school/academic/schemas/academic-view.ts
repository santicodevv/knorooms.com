import type {
  MemberDto,
  SchoolSectionDto,
  SubjectDto,
  TeacherAssignmentDto,
  SectionCapacitySnapshotDto,
} from "@/lib/api/types";

export type AcademicMember = Pick<MemberDto, "membershipId" | "displayName" | "status">;
export type AcademicSectionCapacity = Pick<
  SectionCapacitySnapshotDto,
  "sectionId" | "capacity" | "activeEnrollmentsCount"
>;
export type TeacherAssignmentGroup = {
  teacherMembershipId: string;
  teacherDisplayName: string;
  assignments: TeacherAssignmentDto[];
  weeklyHours: number;
};

const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es")
    .trim();
export function filterAcademicSubjects(subjects: readonly SubjectDto[], query: string) {
  const search = normalize(query);
  return subjects.filter(
    (item) =>
      !search || normalize(item.code).includes(search) || normalize(item.name).includes(search),
  );
}
export function selectAcademicSections(
  sections: readonly SchoolSectionDto[],
  yearId: string,
  gradeId: string,
) {
  return sections.filter(
    (item) =>
      (yearId === "all" || item.academicYearId === yearId) &&
      (gradeId === "all" || item.gradeLevelId === gradeId),
  );
}
export function groupTeacherAssignments(
  assignments: readonly TeacherAssignmentDto[],
): TeacherAssignmentGroup[] {
  const groups = new Map<string, TeacherAssignmentGroup>();
  for (const assignment of assignments) {
    let group = groups.get(assignment.teacherMembershipId);
    if (!group) {
      group = {
        teacherMembershipId: assignment.teacherMembershipId,
        teacherDisplayName: assignment.teacherDisplayName,
        assignments: [],
        weeklyHours: 0,
      };
      groups.set(assignment.teacherMembershipId, group);
    }
    group.assignments.push(assignment);
    group.weeklyHours += assignment.weeklyHours;
  }
  return [...groups.values()];
}
export function formatAcademicDate(value: string) {
  return new Date(value + "T12:00:00Z").toLocaleDateString("es-DO", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}
