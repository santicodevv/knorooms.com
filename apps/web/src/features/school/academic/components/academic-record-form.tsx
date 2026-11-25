import { SchoolSidePanel } from "../../components/school-side-panel";
import { EmptyState } from "@/components/shared/empty-state";
import { ProblemAlert } from "@/components/api/problem-alert";
import { TeacherAssignmentFields } from "./teacher-assignment-fields";
import { SubjectFields } from "./subject-fields";
import { SchoolSectionFields } from "./school-section-fields";
import { GradeLevelFields } from "./grade-level-fields";
import { AcademicYearFields } from "./academic-year-fields";
import type { AcademicState } from "../hooks/use-academic-workspace";
import type { AcademicMember } from "../schemas/academic-view";
const titles: Record<string, string> = {
  year: "Crear año escolar",
  grade: "Registrar grado",
  section: "Crear sección",
  subject: "Registrar materia",
  assignment: "Asignar docente",
};
const subtitles: Record<string, string> = {
  year: "Define el período escolar",
  grade: "Nivel oficial del colegio",
  section: "Una sección pertenece a un año y un grado",
  subject: "Asignatura del catálogo",
  assignment: "Docente, materia y sección",
};
export function AcademicRecordForm({
  kind,
  state: s,
  members,
  canReadMembers,
  membersAvailable,
}: {
  kind: string;
  state: AcademicState;
  members: AcademicMember[];
  canReadMembers: boolean;
  membersAvailable: boolean;
}) {
  const submit =
    kind === "year"
      ? s.submitCreateYear
      : kind === "grade"
        ? s.submitCreateGradeLevel
        : kind === "section"
          ? s.submitCreateSection
          : kind === "subject"
            ? s.submitCreateSubject
            : s.submitAssignTeacher;
  const blocked = kind === "assignment" && (!canReadMembers || !membersAvailable);
  const missingPrerequisites =
    kind === "assignment"
      ? !members.some((item) => item.status === "Active") ||
        !s.availableSections.length ||
        !s.overview.subjects.length
      : kind === "section" &&
        (!s.overview.academicYears.some((item) => !item.isClosed) ||
          !s.overview.gradeLevels.length);
  return (
    <SchoolSidePanel
      title={titles[kind] ?? "Registro académico"}
      subtitle={subtitles[kind] ?? ""}
      busy={s.isPending}
      onClose={s.closeDrawer}
      onSubmit={blocked ? (event) => event.preventDefault() : submit}
      submitLabel={titles[kind] ?? "Guardar"}
      submitDisabled={blocked || missingPrerequisites}
    >
      {s.feedback?.tone === "error" && (
        <ProblemAlert
          problem={{
            title: s.feedback.title,
            status: s.feedback.status ?? 500,
            detail: s.feedback.detail,
          }}
        />
      )}
      {!blocked && missingPrerequisites && (
        <p role="status" className="text-school-small text-school-secondary">
          {kind === "assignment"
            ? "Necesitas una sección de un año abierto, una materia y un miembro activo para asignar un docente."
            : "Necesitas un año escolar abierto y un grado registrado para crear una sección."}
        </p>
      )}
      {blocked ? (
        <EmptyState
          variant="school"
          title={
            !canReadMembers
              ? "Sin permiso para consultar miembros"
              : "Información de miembros no disponible"
          }
          description="Tu equipo de administración puede revisar los accesos de tu cuenta y el directorio institucional."
        />
      ) : kind === "year" ? (
        <AcademicYearFields state={s} />
      ) : kind === "grade" ? (
        <GradeLevelFields state={s} />
      ) : kind === "section" ? (
        <SchoolSectionFields state={s} />
      ) : kind === "subject" ? (
        <SubjectFields state={s} />
      ) : (
        <TeacherAssignmentFields state={s} members={members} />
      )}
    </SchoolSidePanel>
  );
}
