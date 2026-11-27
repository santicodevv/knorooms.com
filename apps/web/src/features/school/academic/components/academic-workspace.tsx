"use client";
import { Button } from "@/components/ui/button";
import { SchoolIcon } from "@/components/shared/school-icon";
import { EmptyState } from "@/components/shared/empty-state";
import { ProblemAlert } from "@/components/api/problem-alert";
import { useSchoolFeedback } from "../../hooks/use-school-feedback";
import { useUnsavedChanges } from "@/features/platform/hooks/use-unsaved-changes";
import { useAcademicWorkspace, type AcademicDrawerKind } from "../hooks/use-academic-workspace";
import { AcademicDirectory } from "./academic-directory";
import { AcademicRecordForm } from "./academic-record-form";
import { AcademicYearConfirmation } from "./academic-year-confirmation";
import type { AcademicMember, AcademicSectionCapacity } from "../schemas/academic-view";
import type { AcademicStructureOverviewDto, ProblemDetails } from "@/lib/api/types";
import styles from "./academic.module.css";
interface Props {
  path?: string[];
  initialOverview: AcademicStructureOverviewDto;
  initialProblem: ProblemDetails | null;
  csrfToken: string;
  members: AcademicMember[];
  canReadAcademic: boolean;
  canManageAcademic: boolean;
  overviewAvailable: boolean;
  canReadMembers: boolean;
  membersAvailable: boolean;
  canReadEnrollments: boolean;
  initialSectionCapacities: AcademicSectionCapacity[] | null;
}
const views: Record<
  string,
  { title: string; description: string; create: string; kind: Exclude<AcademicDrawerKind, null> }
> = {
  years: {
    title: "Años escolares",
    description: "Define el período en el que se matricula y se califica.",
    create: "Crear año escolar",
    kind: "year",
  },
  grades: {
    title: "Grados y secciones",
    description: "Los grados oficiales y sus secciones por año escolar.",
    create: "Registrar grado",
    kind: "grade",
  },
  sections: {
    title: "Grados y secciones",
    description: "Los grados oficiales y sus secciones por año escolar.",
    create: "Registrar grado",
    kind: "section",
  },
  subjects: {
    title: "Materias",
    description: "El catálogo de asignaturas que se imparten en el colegio.",
    create: "Registrar materia",
    kind: "subject",
  },
  assignments: {
    title: "Carga docente",
    description: "Qué docente da cada materia en cada sección.",
    create: "Asignar docente",
    kind: "assignment",
  },
};
export function AcademicWorkspace({
  path = ["academic", "years"],
  canManageAcademic,
  members,
  canReadMembers,
  membersAvailable,
  ...data
}: Props) {
  const view = path[1] ?? "years",
    config = views[view] ?? views.years,
    creating = path[2] === "new";
  const s = useAcademicWorkspace(data);
  const manage = canManageAcademic && s.canReadAcademic && s.overviewAvailable;
  const drawer = creating ? config.kind : s.openDrawer;
  useSchoolFeedback(s.feedback);
  useUnsavedChanges(
    Boolean(drawer) &&
      (s.yearForm.formState.isDirty ||
        s.gradeForm.formState.isDirty ||
        s.sectionForm.formState.isDirty ||
        s.subjectForm.formState.isDirty ||
        s.assignmentForm.formState.isDirty),
  );
  const problem =
    s.problem ??
    (s.feedback?.tone === "error"
      ? { title: s.feedback.title, status: s.feedback.status ?? 500, detail: s.feedback.detail }
      : null);
  return (
    <div className={styles.workspace} aria-busy={s.isPending}>
      <header className="flex flex-wrap items-center gap-4">
        <div className="min-w-0 basis-full lg:flex-1 lg:basis-0">
          <h1 className="text-school-page">{config.title}</h1>
          <p className="text-school-body text-school-secondary mt-1.5">{config.description}</p>
        </div>
        <Button variant="outline" disabled={s.isPending} onClick={s.handleRefresh}>
          <SchoolIcon name="refresh" />
          {s.isPending ? "Actualizando…" : "Actualizar"}
        </Button>
        {manage && (
          <Button onClick={() => s.toggleDrawer(config.kind)}>
            <SchoolIcon name="plus" />
            {config.create}
          </Button>
        )}
      </header>
      {problem && <ProblemAlert problem={problem} />}
      {!s.overviewAvailable ? (
        <section className={styles.surface}>
          <EmptyState
            variant="school"
            title={
              problem
                ? "No se pudo cargar la información"
                : !s.canReadAcademic
                  ? "Sin permiso para consultar la estructura académica"
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
      ) : creating && !manage ? (
        <section className={styles.surface}>
          <EmptyState
            variant="school"
            title="Sin permiso para modificar la estructura académica"
            description="Tu cuenta necesita permiso de gestión y el módulo habilitado para crear registros."
          />
        </section>
      ) : (
        <AcademicDirectory view={view} state={s} canManage={manage} />
      )}
      {drawer && manage && (
        <AcademicRecordForm
          kind={drawer}
          state={s}
          members={members}
          canReadMembers={canReadMembers}
          membersAvailable={membersAvailable}
        />
      )}
      {s.confirmation && manage && <AcademicYearConfirmation state={s} />}
    </div>
  );
}
