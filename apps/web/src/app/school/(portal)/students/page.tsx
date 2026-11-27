import { SchoolStudentsPage } from "@/features/school/server/students-page";
import { SchoolRouteBoundary } from "@/features/school/components/school-route-boundary";
export default function Page() {
  return (
    <SchoolRouteBoundary>
      <SchoolStudentsPage path={["students"]} />
    </SchoolRouteBoundary>
  );
}
