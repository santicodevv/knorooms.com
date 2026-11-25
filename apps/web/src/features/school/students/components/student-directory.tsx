import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";
import { SchoolPagination } from "../../components/school-pagination";
import { useStudentDirectory } from "../hooks/use-student-directory";
import { studentInitials } from "../schemas/student-directory";
import { studentProfileHref } from "../student-navigation";
import { StudentIcon } from "./student-icon";
import { StudentDirectoryCards } from "./student-directory-cards";
import type { ReturnTypeOfStudents, StudentStatusFilter } from "../hooks/use-students-workspace";
import styles from "./students.module.css";
export function StudentDirectory({
  state: s,
  canCreate = false,
}: {
  state: ReturnTypeOfStudents;
  canCreate?: boolean;
}) {
  const list = useStudentDirectory(s.filteredStudents);
  const href = (id: string) =>
    studentProfileHref(id, s.studentSearchQuery, s.studentStatusFilter, list.page);
  return (
    <section className={styles.directory} aria-label="Directorio de estudiantes">
      <div className={styles.filters}>
        <div className={styles.search}>
          <span className={styles.searchIcon}>
            <StudentIcon name="search" />
          </span>
          <Input
            aria-label="Buscar estudiantes"
            placeholder="Buscar nombre, código o SIGERD"
            value={s.studentSearchQuery}
            onChange={(e) => {
              s.setStudentSearchQuery(e.target.value);
              list.setPage(1);
            }}
          />
        </div>
        <div className={styles.selectWrap}>
          <select
            className={styles.select}
            aria-label="Estado del estudiante"
            value={s.studentStatusFilter}
            onChange={(e) => {
              s.setStudentStatusFilter(e.target.value as StudentStatusFilter);
              list.setPage(1);
            }}
          >
            <option value="all">Todos los expedientes</option>
            <option value="active">Activos</option>
            <option value="inactive">Inactivos</option>
            <option value="unassigned">Sin matrícula</option>
          </select>
          <span className={styles.selectIcon}>
            <StudentIcon name="down" />
          </span>
        </div>
      </div>
      {!list.total ? (
        <EmptyState
          variant="school"
          className="flex-1"
          icon={<StudentIcon name="empty-students" />}
          title="Sin estudiantes coincidentes"
          description="Prueba otra búsqueda o crea el primer expediente."
          action={
            canCreate ? (
              <Button onClick={() => s.toggleDrawer("student")}>
                <StudentIcon name="plus" />
                Crear primer expediente
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
          <StudentDirectoryCards
            students={list.rows}
            query={s.studentSearchQuery}
            status={s.studentStatusFilter}
            page={list.page}
          />
          <div className="hidden md:block">
            <Table className={styles.table}>
              <colgroup>
                <col className="w-[35%]" />
                <col className="w-[14%]" />
                <col className="w-[23%]" />
                <col className="w-[15%]" />
                <col />
              </colgroup>
              <TableHeader className="school:bg-school-surface school:border-t-0">
                <TableRow>
                  <TableHead>Estudiante</TableHead>
                  <TableHead>Grado y sección</TableHead>
                  <TableHead>Responsable</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>
                    <span className="sr-only">Ver ficha</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.rows.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell>
                      <Link className={styles.studentCell} href={href(student.id)}>
                        <span className={styles.avatar}>{studentInitials(student.fullName)}</span>
                        <span className="min-w-0">
                          <span className={styles.name}>{student.fullName}</span>
                          <span className={styles.meta + " block"}>{student.studentCode}</span>
                        </span>
                      </Link>
                    </TableCell>
                    <TableCell>
                      {student.latestEnrollment?.status === "Active" ? (
                        <span className="text-school-ink">
                          {student.latestEnrollment.gradeLevelName}{" "}
                          {student.latestEnrollment.sectionCode}
                        </span>
                      ) : student.isActive ? (
                        "Sin sección"
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell>{student.guardians[0]?.fullName ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant={student.isActive ? "success" : "secondary"}>
                        {student.isActive ? "Activo" : "Inactivo"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Link
                        aria-label={`Ver ficha de ${student.fullName}`}
                        href={href(student.id)}
                        className="ui-button flex min-h-11 min-w-8 items-center justify-end"
                      >
                        <StudentIcon name="chevron" />
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}
      {list.total > 0 && <div className="flex-1" />}
      <SchoolPagination variant="school" {...list} onPage={list.setPage} />
    </section>
  );
}
