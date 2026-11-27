import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type { StudentDto } from "@/lib/api/types";
import { studentProfileHref } from "../student-navigation";
import styles from "./students.module.css";
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
    <ul className="divide-school-border divide-y md:hidden">
      {students.map((student) => (
        <li key={student.id}>
          <Link
            href={studentProfileHref(student.id, query, status, page)}
            className="ui-button flex flex-col gap-3 p-5"
          >
            <span className="flex items-center justify-between gap-3">
              <span className={styles.name}>{student.fullName}</span>
              <Badge variant={student.isActive ? "success" : "secondary"}>
                {student.isActive ? "Activo" : "Inactivo"}
              </Badge>
            </span>
            <span className={styles.meta}>{student.studentCode}</span>
            <span className="text-school-small text-school-secondary">
              {student.latestEnrollment?.status === "Active"
                ? student.latestEnrollment.gradeLevelName +
                  " " +
                  student.latestEnrollment.sectionCode
                : "Sin sección"}
            </span>
            <span className="text-school-small text-school-secondary">
              {student.guardians[0]?.fullName ?? "Sin responsable vinculado"}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
