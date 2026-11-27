"use client";
import Link from "next/link";
import { ProblemAlert } from "@/components/api/problem-alert";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { useUnsavedChanges } from "@/features/platform/hooks/use-unsaved-changes";
import { useStudentsWorkspace } from "../hooks/use-students-workspace";
import { StudentCreateForm } from "./student-create-form";
import { StudentDirectory } from "./student-directory";
import { StudentProfile } from "./student-profile";
import { StudentActionDialog } from "./student-action-dialog";
import { GuardianDirectory } from "./guardian-directory";
import { EnrollmentDirectory } from "./enrollment-directory";
import { StudentIcon } from "./student-icon";
import type {
  EnrollmentsOverviewDto,
  ProblemDetails,
  StudentDirectoryOverviewDto,
} from "@/lib/api/types";
import styles from "./students.module.css";
interface Props {
  path?: string[];
  initialDirectory: StudentDirectoryOverviewDto;
  initialEnrollments: EnrollmentsOverviewDto;
  initialProblem: ProblemDetails | null;
  csrfToken: string;
  canManageStudents: boolean;
  canManageEnrollments: boolean;
  canReadStudents: boolean;
  canReadEnrollments: boolean;
  directoryAvailable: boolean;
  enrollmentsAvailable: boolean;
}
export function StudentsWorkspace({
  path = ["students"],
  canManageStudents,
  canManageEnrollments,
  ...data
}: Props) {
  const [area, record] = path;
  const guardian = area === "guardians";
  const profile = area === "students" && !!record && record !== "new";
  const s = useStudentsWorkspace({ ...data, studentId: profile ? record : undefined });
  useUnsavedChanges(s.studentForm.formState.isDirty || s.guardianForm.formState.isDirty);
  const create = canManageStudents && s.canReadStudents && s.directoryAvailable;
  const panel = record === "new" ? (guardian ? "guardian" : "student") : s.openDrawer;
  const problem =
    s.problem ??
    (s.feedback?.tone === "error"
      ? { title: s.feedback.title, status: s.feedback.status ?? 500, detail: s.feedback.detail }
      : null);
  return (
    <div className={styles.workspace} aria-busy={s.isPending}>
      {!profile && (
        <header className="flex flex-wrap items-center gap-4">
          <div className="min-w-0 basis-full lg:flex-1 lg:basis-0">
            <h1 className="text-school-page">
              {area === "enrollments" ? "Matrículas" : guardian ? "Responsables" : "Estudiantes"}
            </h1>
            <p className="text-school-body text-school-secondary mt-1.5">
              {area === "enrollments"
                ? "Consulta cupos y administra matrículas por sección y año escolar."
                : guardian
                  ? "Padres, madres y tutores vinculados a los estudiantes."
                  : "Expedientes permanentes, consultas y vínculos con responsables."}
            </p>
          </div>
          <Button variant="outline" disabled={s.isPending} onClick={s.handleRefresh}>
            <StudentIcon name="refresh" />
            {s.isPending ? "Actualizando…" : "Actualizar"}
          </Button>
          {area !== "enrollments" && create && (
            <Button onClick={() => s.toggleDrawer(guardian ? "guardian" : "student")}>
              <StudentIcon name="plus" />
              {guardian ? "Nuevo responsable" : "Nuevo estudiante"}
            </Button>
          )}
        </header>
      )}
      {problem && <ProblemAlert problem={problem} />}
      {!s.directoryAvailable && area !== "enrollments" ? (
        <section className={styles.directory}>
          <EmptyState
            variant="school"
            title={
              problem
                ? "No se pudo cargar la información"
                : !s.canReadStudents
                  ? "Sin permiso para consultar estudiantes"
                  : "Información no disponible"
            }
            description={
              problem
                ? "Vuelve a intentarlo para obtener los registros del colegio."
                : "Tu equipo de administración puede revisar los accesos de tu cuenta."
            }
            action={
              problem ? (
                <Button variant="outline" disabled={s.isPending} onClick={s.handleRefresh}>
                  Reintentar
                </Button>
              ) : undefined
            }
          />
        </section>
      ) : record === "new" && !create ? (
        <section className={styles.directory}>
          <EmptyState
            variant="school"
            title="Sin permiso para crear registros"
            description="Tu cuenta necesita permiso de gestión y un módulo habilitado para crear registros."
            action={<Link href={guardian ? "/guardians" : "/students"}>Volver al directorio</Link>}
          />
        </section>
      ) : profile ? (
        s.selectedStudent ? (
          <StudentProfile
            state={s}
            canManageStudents={create}
            canManageEnrollments={canManageEnrollments && s.enrollmentsAvailable}
          />
        ) : (
          <EmptyState
            variant="school"
            title="Expediente no encontrado"
            action={<Link href="/students">Volver a estudiantes</Link>}
          />
        )
      ) : area === "enrollments" ? (
        <EnrollmentDirectory state={s} canManage={canManageEnrollments} />
      ) : guardian ? (
        <GuardianDirectory state={s} canCreate={create} />
      ) : (
        <StudentDirectory state={s} canCreate={create} />
      )}
      {create && (panel === "student" || panel === "guardian") && (
        <StudentCreateForm state={s} guardian={panel === "guardian"} />
      )}
      <StudentActionDialog state={s} />
      {s.createdStudent && (
        <aside role="status" className={styles.success}>
          <span className="bg-school-success flex size-8 shrink-0 items-center justify-center rounded-full">
            <StudentIcon name="check" />
          </span>
          <div className="min-w-0">
            <p className="text-school-button font-semibold">Expediente creado</p>
            <p className="text-school-label text-school-border mt-0.5">
              {s.createdStudent.fullName} · {s.createdStudent.studentCode}
            </p>
          </div>
          <Link
            href={"/students/" + s.createdStudent.id}
            className="ui-button bg-school-surface text-school-ink rounded-lg px-3 py-2 text-sm font-semibold whitespace-nowrap"
          >
            Ver ficha
          </Link>
        </aside>
      )}
      {s.feedback?.tone === "success" && !s.createdStudent && (
        <p role="status" className="text-school-small text-school-success">
          {s.feedback.title}
        </p>
      )}
    </div>
  );
}
