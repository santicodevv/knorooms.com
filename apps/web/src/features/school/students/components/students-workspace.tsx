"use client";
import { useStudentProfile } from "../hooks/use-student-profile";
import { Plus } from "lucide-react";
import { ProblemAlert } from "@/components/api/problem-alert";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { SchoolPageHeading, SchoolFormFrame } from "../../components/school-ui";
import { useSchoolFeedback } from "../../hooks/use-school-feedback";
import { useUnsavedChanges } from "@/features/platform/hooks/use-unsaved-changes";
import { useStudentsWorkspace } from "../hooks/use-students-workspace";
import { StudentCreateForm } from "./student-create-form";
import { StudentDirectory } from "./student-directory";
import { StudentProfile } from "./student-profile";
import { StudentActionDialog } from "./student-action-dialog";
import { GuardianDirectory } from "./guardian-directory";
import { EnrollmentDirectory } from "./enrollment-directory";
import type {
  EnrollmentsOverviewDto,
  ProblemDetails,
  StudentDirectoryOverviewDto,
} from "@/lib/api/types";
interface Props {
  path?: string[];
  initialDirectory: StudentDirectoryOverviewDto;
  initialEnrollments: EnrollmentsOverviewDto;
  initialProblem: ProblemDetails | null;
  csrfToken: string;
  canManageStudents: boolean;
  canManageEnrollments: boolean;
}
export function StudentsWorkspace({
  path = ["students"],
  canManageStudents,
  canManageEnrollments,
  ...data
}: Props) {
  const [area, record] = path;
  const profileNavigation = useStudentProfile();
  const s = useStudentsWorkspace({
    ...data,
    studentId: area === "students" && record !== "new" ? record : undefined,
  });
  useSchoolFeedback(s.feedback);
  useUnsavedChanges(s.studentForm.formState.isDirty || s.guardianForm.formState.isDirty);
  const problem = s.problem ? (
    <ProblemAlert problem={s.problem} />
  ) : s.feedback?.tone === "error" ? (
    <p
      role="alert"
      className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-xs text-red-800"
    >
      {s.feedback.title} · {s.feedback.detail}
    </p>
  ) : null;
  if (record === "new")
    return (
      <>
        {problem}
        {canManageStudents ? (
          <SchoolFormFrame
            title={area === "guardians" ? "Nuevo responsable" : "Nuevo expediente"}
            description={
              area === "guardians"
                ? "Registra sus datos para vincularlo a los estudiantes."
                : "Registra al estudiante. La matrícula es un paso independiente."
            }
            back={"/" + area}
          >
            <StudentCreateForm state={s} guardian={area === "guardians"} />
          </SchoolFormFrame>
        ) : (
          <EmptyState title="No tienes permiso para crear registros" />
        )}
      </>
    );
  if (area === "students" && record)
    return (
      <>
        {problem}
        <SchoolPageHeading
          title={s.selectedStudent?.id === record ? s.selectedStudent.fullName : "Expediente"}
          description="Información permanente, responsables y matrículas."
          back={profileNavigation.back}
        />
        {s.selectedStudent?.id === record ? (
          <StudentProfile
            state={s}
            canManageStudents={canManageStudents}
            canManageEnrollments={canManageEnrollments}
          />
        ) : (
          <EmptyState title="Expediente no encontrado" />
        )}
        <StudentActionDialog state={s} />
      </>
    );
  const title =
    area === "enrollments" ? "Matrículas" : area === "guardians" ? "Responsables" : "Estudiantes";
  return (
    <div>
      {problem}
      <SchoolPageHeading
        onRefresh={s.handleRefresh}
        refreshing={s.isPending}
        title={title}
        description={
          area === "enrollments"
            ? "Consulta cupos y administra matrículas por sección y año escolar."
            : area === "guardians"
              ? "Directorio familiar y vínculos con los expedientes escolares."
              : "Expedientes permanentes, consultas y vínculos con responsables."
        }
        actions={
          area === "enrollments" ? (
            <ButtonLink href="/students">Buscar estudiante para matricular</ButtonLink>
          ) : canManageStudents ? (
            <ButtonLink href={"/" + area + "/new"}>
              <Plus />
              {area === "guardians" ? "Nuevo responsable" : "Nuevo estudiante"}
            </ButtonLink>
          ) : undefined
        }
      />
      {area === "enrollments" ? (
        <EnrollmentDirectory state={s} canManage={canManageEnrollments} />
      ) : area === "guardians" ? (
        <GuardianDirectory state={s} />
      ) : (
        <StudentDirectory state={s} />
      )}
      <StudentActionDialog state={s} />
    </div>
  );
}
