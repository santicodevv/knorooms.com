import { SchoolEvaluationsPage } from "@/features/school/server/evaluations-page";
import { SchoolRouteBoundary } from "@/features/school/components/school-route-boundary";
export default function Page() {
  return (
    <SchoolRouteBoundary>
      <SchoolEvaluationsPage path={["attendance"]} />
    </SchoolRouteBoundary>
  );
}
