import { TeacherAssignmentFields } from "./teacher-assignment-fields";
import { SubjectFields } from "./subject-fields";
import { SchoolSectionFields } from "./school-section-fields";
import { GradeLevelFields } from "./grade-level-fields";
import { AcademicYearFields } from "./academic-year-fields";
import { SchoolFormActions } from "../../components/school-ui";
import type { AcademicState } from "../hooks/use-academic-workspace";
import type { MemberDto } from "@/lib/api/types";
export function AcademicRecordForm({
  kind,
  state: s,
  members,
}: {
  kind: string;
  state: AcademicState;
  members: MemberDto[];
}) {
  const submit =
    kind === "years"
      ? s.submitCreateYear
      : kind === "grades"
        ? s.submitCreateGradeLevel
        : kind === "sections"
          ? s.submitCreateSection
          : kind === "subjects"
            ? s.submitCreateSubject
            : s.submitAssignTeacher;
  return (
    <form onSubmit={submit} noValidate className="space-y-6 p-6">
      <div className="grid gap-5 sm:grid-cols-2">
        {kind === "years" && <AcademicYearFields state={s} />}
        {kind === "grades" && <GradeLevelFields state={s} />}
        {kind === "sections" && <SchoolSectionFields state={s} />}
        {kind === "subjects" && <SubjectFields state={s} />}
        {kind === "assignments" && <TeacherAssignmentFields state={s} members={members} />}
      </div>
      <SchoolFormActions
        back={"/academic/" + (kind === "sections" ? "grades" : kind)}
        busy={s.isPending}
      />
    </form>
  );
}
