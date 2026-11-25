import { Input } from "@/components/ui/input";
import { SchoolFormField } from "../../components/school-form-field";
import { AcademicIcon } from "./academic-icon";
import type { AcademicMember } from "../schemas/academic-view";
import type { AcademicState } from "../hooks/use-academic-workspace";
import styles from "./academic.module.css";
export function TeacherAssignmentFields({
  state: s,
  members,
}: {
  state: AcademicState;
  members: AcademicMember[];
}) {
  const f = s.assignmentForm,
    e = f.formState.errors;
  return (
    <>
      <SchoolFormField
        id="academic-assignment-section"
        label="Sección *"
        error={e.sectionId?.message}
      >
        <div className={styles.fieldSelect}>
          <select
            id="academic-assignment-section"
            disabled={s.isPending}
            aria-invalid={!!e.sectionId}
            aria-describedby={e.sectionId ? "academic-assignment-section-error" : undefined}
            {...f.register("sectionId")}
          >
            <option value="">Selecciona una sección</option>
            {s.availableSections.map((item) => (
              <option key={item.id} value={item.id}>
                {item.academicYearCode} · {item.gradeLevelName} {item.code}
              </option>
            ))}
          </select>
          <span>
            <AcademicIcon name="select-down" />
          </span>
        </div>
      </SchoolFormField>
      <SchoolFormField
        id="academic-assignment-subject"
        label="Materia *"
        error={e.subjectId?.message}
      >
        <div className={styles.fieldSelect}>
          <select
            id="academic-assignment-subject"
            disabled={s.isPending}
            aria-invalid={!!e.subjectId}
            aria-describedby={e.subjectId ? "academic-assignment-subject-error" : undefined}
            {...f.register("subjectId")}
          >
            <option value="">Selecciona una materia</option>
            {s.overview.subjects.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
          <span>
            <AcademicIcon name="select-down" />
          </span>
        </div>
      </SchoolFormField>
      <SchoolFormField
        id="academic-assignment-member"
        label="Docente institucional *"
        error={e.teacherMembershipId?.message}
      >
        <div className={styles.fieldSelect}>
          <select
            id="academic-assignment-member"
            disabled={s.isPending}
            aria-invalid={!!e.teacherMembershipId}
            aria-describedby={
              e.teacherMembershipId ? "academic-assignment-member-error" : undefined
            }
            {...f.register("teacherMembershipId")}
          >
            <option value="">Selecciona un docente</option>
            {members
              .filter((item) => item.status === "Active")
              .map((item) => (
                <option key={item.membershipId} value={item.membershipId}>
                  {item.displayName}
                </option>
              ))}
          </select>
          <span>
            <AcademicIcon name="select-down" />
          </span>
        </div>
      </SchoolFormField>
      <SchoolFormField
        id="academic-assignment-hours"
        label="Horas semanales *"
        error={e.weeklyHours?.message}
        hint="Horas pedagógicas por semana"
      >
        <Input
          id="academic-assignment-hours"
          type="number"
          min={1}
          max={40}
          placeholder="1 a 40"
          disabled={s.isPending}
          aria-invalid={!!e.weeklyHours}
          aria-describedby={"academic-assignment-hours-" + (e.weeklyHours ? "error" : "hint")}
          {...f.register("weeklyHours", { valueAsNumber: true })}
        />
      </SchoolFormField>
    </>
  );
}
