import { SchoolRouteBoundary } from "@/features/school/components/school-route-boundary";
import { notFound } from "next/navigation";
import { SchoolStudentsPage } from "@/features/school/server/students-page";
import { SchoolAcademicPage } from "@/features/school/server/academic-page";
import { SchoolEvaluationsPage } from "@/features/school/server/evaluations-page";
import { SchoolSettingsPage } from "@/features/school/server/settings-page";
async function SchoolRouteContent({ params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const [area, view, action] = path;
  if (area === "students" && path.length === 2) return <SchoolStudentsPage path={path} />;
  if (
    (area === "guardians" || area === "enrollments") &&
    (path.length === 1 || (view === "new" && path.length === 2 && area === "guardians"))
  )
    return <SchoolStudentsPage path={path} />;
  if (
    area === "academic" &&
    ["years", "grades", "sections", "subjects", "assignments"].includes(view) &&
    (path.length === 2 || (action === "new" && path.length === 3))
  )
    return <SchoolAcademicPage path={path} />;
  if (["attendance", "grading", "report-cards"].includes(area) && path.length === 1)
    return <SchoolEvaluationsPage path={path} />;
  if (
    area === "settings" &&
    view === "policies" &&
    (path.length === 2 || (action === "new" && path.length === 3))
  )
    return <SchoolEvaluationsPage path={path} />;
  if ((area === "settings" || area === "moodle") && path.length === 1)
    return <SchoolSettingsPage moodle={area === "moodle"} />;
  notFound();
}

export default function Page(props: { params: Promise<{ path: string[] }> }) {
  return (
    <SchoolRouteBoundary>
      <SchoolRouteContent {...props} />
    </SchoolRouteBoundary>
  );
}
