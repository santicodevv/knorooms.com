import { AcademicYearDirectory } from "./academic-year-directory";
import { AcademicGradesDirectory } from "./academic-grades-directory";
import { AcademicSubjectsDirectory } from "./academic-subjects-directory";
import { AcademicAssignmentsDirectory } from "./academic-assignments-directory";
import type { AcademicState } from "../hooks/use-academic-workspace";
export function AcademicDirectory({
  view,
  state,
  canManage,
}: {
  view: string;
  state: AcademicState;
  canManage: boolean;
}) {
  return view === "years" ? (
    <AcademicYearDirectory state={state} canManage={canManage} />
  ) : view === "grades" || view === "sections" ? (
    <AcademicGradesDirectory state={state} canManage={canManage} />
  ) : view === "subjects" ? (
    <AcademicSubjectsDirectory state={state} canManage={canManage} />
  ) : (
    <AcademicAssignmentsDirectory state={state} canManage={canManage} />
  );
}
