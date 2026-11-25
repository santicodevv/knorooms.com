import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { SchoolHomePanel } from "./school-home-panel";
export function SchoolHomeReview({
  unassigned,
  atCapacity,
  canReviewStudents,
}: {
  unassigned: number;
  atCapacity: number;
  canReviewStudents: boolean;
}) {
  return (
    <SchoolHomePanel title="Para revisar">
      {canReviewStudents && (
        <Link href="/students" className="flex items-center justify-between gap-3 px-5.5 py-3">
          <span>
            <span className="text-school-ink text-school-small block font-semibold">
              Sin matrícula activa
            </span>
            <span className="text-school-secondary text-school-label block font-normal">
              {unassigned} {unassigned === 1 ? "estudiante" : "estudiantes"}
            </span>
          </span>
          <Badge variant="warning">{unassigned}</Badge>
        </Link>
      )}
      <Link href="/enrollments" className="flex items-center justify-between gap-3 px-5.5 py-3">
        <span>
          <span className="text-school-ink text-school-small block font-semibold">
            Secciones al límite
          </span>
          <span className="text-school-secondary text-school-label block font-normal">
            Más del 95 % de cupo
          </span>
        </span>
        <Badge variant="secondary">{atCapacity}</Badge>
      </Link>
    </SchoolHomePanel>
  );
}
