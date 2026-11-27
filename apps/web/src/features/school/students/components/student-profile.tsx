import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { useStudentProfile } from "../hooks/use-student-profile";
import { calculateStudentAge } from "../schemas/students-schemas";
import { StudentIcon } from "./student-icon";
import { StudentProfileSummary } from "./student-profile-summary";
import { StudentProfileGuardians } from "./student-profile-guardians";
import { StudentProfileEnrollments } from "./student-profile-enrollments";
import type { ReturnTypeOfStudents } from "../hooks/use-students-workspace";
export function StudentProfile({
  state: s,
  canManageStudents,
  canManageEnrollments,
}: {
  state: ReturnTypeOfStudents;
  canManageStudents: boolean;
  canManageEnrollments: boolean;
}) {
  const navigation = useStudentProfile();
  const student = s.selectedStudent;
  if (!student) return null;
  return (
    <>
      <header className="flex flex-wrap items-center gap-4">
        <div className="min-w-0 basis-full lg:flex-1 lg:basis-0">
          <Link
            href={navigation.back}
            className="ui-button text-school-button text-school-secondary mb-1.5 inline-flex items-center gap-1.5"
          >
            <StudentIcon name="back" />
            Estudiantes
          </Link>
          <h1 className="text-school-page break-words">{student.fullName}</h1>
          <p className="text-school-body text-school-secondary mt-1.5">
            {student.studentCode} · {calculateStudentAge(student.birthDate)} años
          </p>
        </div>
        <Badge variant={student.isActive ? "success" : "secondary"}>
          {student.isActive ? "Activo" : "Inactivo"}
        </Badge>
        {canManageStudents && (
          <Button
            variant="outline"
            disabled={s.isPending}
            onClick={() =>
              s.handleToggleStudentActive(student.id, student.fullName, student.isActive)
            }
          >
            {student.isActive ? "Desactivar expediente" : "Activar expediente"}
          </Button>
        )}
      </header>
      <div>
        <SegmentedControl
          name="student-profile-tab"
          label="Ficha del estudiante"
          options={[
            { value: "summary", label: "Resumen" },
            { value: "guardians", label: "Responsables" },
            { value: "enrollments", label: "Matrículas" },
          ]}
          value={navigation.tab}
          onValueChange={navigation.setTab}
        />
      </div>
      {navigation.tab === "guardians" ? (
        <StudentProfileGuardians state={s} canManage={canManageStudents} />
      ) : navigation.tab === "enrollments" ? (
        <StudentProfileEnrollments state={s} canManage={canManageEnrollments} />
      ) : (
        <StudentProfileSummary student={student} />
      )}
    </>
  );
}
