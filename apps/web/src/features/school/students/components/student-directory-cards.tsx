import type { StudentDto } from "@/lib/api/types";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { studentProfileHref } from "../student-navigation";
export function StudentDirectoryCards({
  students,
  query,
  status,
  page,
}: {
  students: StudentDto[];
  query: string;
  status: string;
  page: number;
}) {
  return (
    <ul className="divide-y divide-slate-200 md:hidden">
      {students.map((student) => (
        <li key={student.id} className="space-y-4 p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-slate-900">{student.fullName}</h2>
              <p className="mt-1 text-xs text-slate-600">{student.studentCode}</p>
            </div>
            <Badge variant={student.isActive ? "success" : "secondary"}>
              {student.isActive ? "Activo" : "Inactivo"}
            </Badge>
          </div>
          <p className="text-xs text-slate-700">
            {student.latestEnrollment?.status === "Active"
              ? student.latestEnrollment.gradeLevelName +
                " · Sección " +
                student.latestEnrollment.sectionCode
              : "Pendiente de matrícula"}
          </p>
          <ButtonLink
            size="sm"
            variant="outline"
            href={studentProfileHref(student.id, query, status, page)}
          >
            Ver ficha<span className="sr-only"> de {student.fullName}</span>
          </ButtonLink>
        </li>
      ))}
    </ul>
  );
}
