import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { getEnrollmentStatusMeta } from "../schemas/students-schemas";
import { StudentIcon } from "./student-icon";
import type { ReturnTypeOfStudents } from "../hooks/use-students-workspace";
import styles from "./students.module.css";
export function StudentProfileEnrollments({
  state: s,
  canManage,
}: {
  state: ReturnTypeOfStudents;
  canManage: boolean;
}) {
  const student = s.selectedStudent;
  if (!student) return null;
  if (!s.enrollmentsAvailable)
    return (
      <EmptyState
        variant="school"
        title={
          s.canReadEnrollments
            ? "Información de matrículas no disponible"
            : "Sin permiso para consultar matrículas"
        }
      />
    );
  const rows = s.enrollmentsOverview.enrollments.filter((item) => item.studentId === student.id);
  return (
    <section
      className="bg-school-surface rounded-school-card overflow-hidden"
      aria-label="Matrículas del estudiante"
    >
      {rows.length ? (
        <Table className={styles.table}>
          <colgroup>
            <col className="w-[20%]" />
            <col className="w-[26%]" />
            <col className="w-[16%]" />
            <col />
          </colgroup>
          <TableHeader className="school:bg-school-surface school:border-t-0">
            <TableRow>
              <TableHead>Año escolar</TableHead>
              <TableHead>Sección</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <strong className="text-school-ink font-semibold">{item.academicYearCode}</strong>
                </TableCell>
                <TableCell>
                  {item.gradeLevelName} {item.sectionCode}
                </TableCell>
                <TableCell>
                  <Badge variant={item.status === "Active" ? "success" : "secondary"}>
                    {getEnrollmentStatusMeta(item.status).shortLabel}
                  </Badge>
                </TableCell>
                <TableCell>
                  {canManage && item.status === "Active" && (
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={s.isPending}
                        onClick={() => s.openTransferForEnrollment(item)}
                      >
                        Trasladar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={s.isPending}
                        onClick={() => s.handleWithdrawEnrollment(item.id, item.studentFullName)}
                      >
                        Retirar
                      </Button>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <EmptyState
          variant="school"
          title="Sin matrículas registradas"
          description="La matrícula vincula este expediente a una sección y un año escolar."
        />
      )}
      {canManage && student.isActive && (
        <footer className="border-school-border border-t p-5">
          <Button disabled={s.isPending} onClick={() => s.toggleDrawer("enroll")}>
            <StudentIcon name="plus" />
            Matricular estudiante
          </Button>
        </footer>
      )}
    </section>
  );
}
