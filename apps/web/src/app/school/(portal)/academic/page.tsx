import { SchoolAcademicPage } from "@/features/school/server/academic-page";
import { SchoolRouteBoundary } from "@/features/school/components/school-route-boundary";
export default function Page() {
  return (
    <SchoolRouteBoundary>
      <SchoolAcademicPage path={["academic", "years"]} />
    </SchoolRouteBoundary>
  );
}
