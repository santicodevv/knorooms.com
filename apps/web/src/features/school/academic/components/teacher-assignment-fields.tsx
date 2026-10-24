import { SchoolField, schoolSelectClass } from "../../components/school-ui";
import { Input } from "@/components/ui/input";
import type { AcademicState } from "../hooks/use-academic-workspace";
import type { MemberDto } from "@/lib/api/types";
export function TeacherAssignmentFields({
  state: s,
  members,
}: {
  state: AcademicState;
  members: MemberDto[];
}) {
  return (
    <>
      <SchoolField label="Sección *" error={s.assignmentForm.formState.errors.sectionId?.message}>
        <select className={schoolSelectClass} {...s.assignmentForm.register("sectionId")}>
          <option value="">Seleccionar sección</option>
          {s.overview.sections
            .filter(
              (sec) => !s.overview.academicYears.find((y) => y.id === sec.academicYearId)?.isClosed,
            )
            .map((sec) => (
              <option key={sec.id} value={sec.id}>
                {sec.academicYearCode} · {sec.gradeLevelName} {sec.code}
              </option>
            ))}
        </select>
      </SchoolField>
      <SchoolField label="Materia *" error={s.assignmentForm.formState.errors.subjectId?.message}>
        <select className={schoolSelectClass} {...s.assignmentForm.register("subjectId")}>
          <option value="">Seleccionar materia</option>
          {s.overview.subjects.map((sub) => (
            <option key={sub.id} value={sub.id}>
              {sub.name}
            </option>
          ))}
        </select>
      </SchoolField>
      <SchoolField
        label="Docente institucional *"
        error={s.assignmentForm.formState.errors.teacherMembershipId?.message}
      >
        <select className={schoolSelectClass} {...s.assignmentForm.register("teacherMembershipId")}>
          <option value="">Seleccionar docente</option>
          {members
            .filter((m) => m.status === "Active")
            .map((m) => (
              <option key={m.membershipId} value={m.membershipId}>
                {m.displayName}
              </option>
            ))}
        </select>
      </SchoolField>
      <SchoolField
        label="Horas semanales *"
        error={s.assignmentForm.formState.errors.weeklyHours?.message}
      >
        <Input
          type="number"
          min={1}
          max={40}
          {...s.assignmentForm.register("weeklyHours", { valueAsNumber: true })}
        />
      </SchoolField>
    </>
  );
}
