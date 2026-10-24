"use client";
import { Input } from "@/components/ui/input";
import { ButtonLink } from "@/components/ui/button";
import { ProblemAlert } from "@/components/api/problem-alert";
import { EmptyState } from "@/components/shared/empty-state";
import {
  SchoolPageHeading,
  SchoolTabs,
  SchoolFormFrame,
  schoolSelectClass,
} from "../../components/school-ui";
import { useSchoolFeedback } from "../../hooks/use-school-feedback";
import { useUnsavedChanges } from "@/features/platform/hooks/use-unsaved-changes";
import { useAcademicWorkspace } from "../hooks/use-academic-workspace";
import { AcademicDirectory } from "./academic-directory";
import { AcademicRecordForm } from "./academic-record-form";
import type { AcademicStructureOverviewDto, MemberDto, ProblemDetails } from "@/lib/api/types";
interface Props {
  path?: string[];
  initialOverview: AcademicStructureOverviewDto;
  initialProblem: ProblemDetails | null;
  members: MemberDto[];
  csrfToken: string;
  canManageAcademic: boolean;
}
const tabs = [
  { key: "years", label: "Años escolares" },
  { key: "grades", label: "Grados y secciones" },
  { key: "subjects", label: "Materias" },
  { key: "assignments", label: "Carga docente" },
].map((i) => ({ ...i, href: "/academic/" + i.key }));
const titles: Record<string, string> = {
  years: "Crear año escolar",
  grades: "Registrar grado",
  sections: "Crear sección",
  subjects: "Registrar materia",
  assignments: "Asignar docente",
};
export function AcademicWorkspace({
  path = ["academic", "years"],
  canManageAcademic,
  members,
  ...data
}: Props) {
  const s = useAcademicWorkspace(data),
    view = path[1] ?? "years",
    creating = path[2] === "new";
  useSchoolFeedback(s.feedback);
  useUnsavedChanges(
    creating &&
      (s.yearForm.formState.isDirty ||
        s.gradeForm.formState.isDirty ||
        s.sectionForm.formState.isDirty ||
        s.subjectForm.formState.isDirty ||
        s.assignmentForm.formState.isDirty),
  );
  const error = s.problem ? (
    <ProblemAlert problem={s.problem} />
  ) : s.feedback?.tone === "error" ? (
    <p role="alert" className="mb-4 rounded-lg bg-red-50 p-4 text-xs text-red-800">
      {s.feedback.title} · {s.feedback.detail}
    </p>
  ) : null;
  if (creating)
    return (
      <>
        {error}
        {canManageAcademic ? (
          <SchoolFormFrame
            title={titles[view]}
            description="Organiza la estructura del colegio con datos propios de esta institución."
            back={"/academic/" + (view === "sections" ? "grades" : view)}
          >
            <AcademicRecordForm kind={view} state={s} members={members} />
          </SchoolFormFrame>
        ) : (
          <EmptyState title="No tienes permiso para modificar la estructura académica" />
        )}
      </>
    );
  return (
    <>
      {error}
      <SchoolPageHeading
        onRefresh={s.handleRefresh}
        refreshing={s.isPending}
        title="Organización académica"
        description="Configura la estructura del colegio antes de matricular y asignar docentes."
        actions={
          canManageAcademic ? (
            <ButtonLink href={"/academic/" + view + "/new"}>{titles[view]}</ButtonLink>
          ) : undefined
        }
      />
      <SchoolTabs items={tabs} active={view} />
      {["grades", "assignments"].includes(view) && (
        <div className="mb-5 max-w-60">
          <label
            className="text-muted mb-2 block text-xs font-semibold"
            htmlFor="academic-year-view"
          >
            Año escolar
          </label>
          <select
            id="academic-year-view"
            className={schoolSelectClass}
            value={s.selectedAcademicYearId}
            onChange={(e) => s.setSelectedAcademicYearId(e.target.value)}
          >
            <option value="all">Todos los años</option>
            {s.overview.academicYears.map((y) => (
              <option key={y.id} value={y.id}>
                {y.code}
              </option>
            ))}
          </select>
        </div>
      )}
      {view === "subjects" && (
        <div className="mb-5 max-w-sm">
          <Input
            aria-label="Buscar materias"
            placeholder="Buscar código o nombre de materia"
            value={s.subjectSearchQuery}
            onChange={(e) => s.setSubjectSearchQuery(e.target.value)}
          />
        </div>
      )}
      {view === "grades" && (
        <div className="mb-5 max-w-60">
          <label className="text-muted mb-2 block text-xs font-semibold" htmlFor="grade-view">
            Grado
          </label>
          <select
            id="grade-view"
            className={schoolSelectClass}
            value={s.selectedGradeLevelId}
            onChange={(e) => s.setSelectedGradeLevelId(e.target.value)}
          >
            <option value="all">Todos los grados</option>
            {s.overview.gradeLevels.map((g) => (
              <option key={g.id} value={g.id}>
                {g.displayName}
              </option>
            ))}
          </select>
        </div>
      )}
      <AcademicDirectory view={view} state={s} canManage={canManageAcademic} />
    </>
  );
}
