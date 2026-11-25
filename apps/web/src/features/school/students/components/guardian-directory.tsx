import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { SchoolPagination } from "../../components/school-pagination";
import { useGuardianDirectory } from "../hooks/use-student-directory";
import { linkedGuardianStudents, studentInitials } from "../schemas/student-directory";
import { StudentIcon } from "./student-icon";
import type { ReturnTypeOfStudents } from "../hooks/use-students-workspace";
import styles from "./students.module.css";
export function GuardianDirectory({
  state: s,
  canCreate = false,
}: {
  state: ReturnTypeOfStudents;
  canCreate?: boolean;
}) {
  const list = useGuardianDirectory(s.directory.guardians);
  return (
    <section className={styles.directory} aria-label="Directorio de responsables">
      <div className={styles.filters}>
        <div className={styles.search}>
          <span className={styles.searchIcon}>
            <StudentIcon name="search" />
          </span>
          <Input
            aria-label="Buscar responsables"
            placeholder="Buscar responsable por nombre o correo"
            value={list.query}
            onChange={(e) => list.setQuery(e.target.value)}
          />
        </div>
      </div>
      {!list.total ? (
        <EmptyState
          variant="school"
          className="flex-1"
          icon={<StudentIcon name="empty-guardians" />}
          title={list.query ? "Sin responsables coincidentes" : "Aún no hay responsables"}
          description={
            list.query
              ? "Prueba otro nombre o correo."
              : "Registra a los padres o tutores para vincularlos a sus hijos."
          }
          action={
            canCreate ? (
              <Button onClick={() => s.toggleDrawer("guardian")}>
                <StudentIcon name="plus" />
                Nuevo responsable
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
          <div className="hidden md:block">
            <Table className={styles.table}>
              <colgroup>
                <col className="w-[32%]" />
                <col className="w-[17%]" />
                <col />
                <col className="w-[8%]" />
              </colgroup>
              <TableHeader className="school:bg-school-surface school:border-t-0">
                <TableRow>
                  <TableHead>Responsable</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead>Estudiantes vinculados</TableHead>
                  <TableHead>
                    <span className="sr-only">Ver estudiante</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.rows.map((g) => {
                  const students = linkedGuardianStudents(s.directory.students, g.id);
                  return (
                    <TableRow key={g.id}>
                      <TableCell>
                        <span className={styles.studentCell}>
                          <span className={styles.avatar}>{studentInitials(g.fullName)}</span>
                          <span>
                            <span className={styles.name}>{g.fullName}</span>
                            <span className={styles.meta + " block"}>{g.email}</span>
                          </span>
                        </span>
                      </TableCell>
                      <TableCell>{g.phoneNumber || "—"}</TableCell>
                      <TableCell>
                        <span className="flex flex-wrap gap-x-3 gap-y-1">
                          {students.length
                            ? students.map((student) => (
                                <Link
                                  key={student.id}
                                  href={`/students/${student.id}?tab=guardians`}
                                  className="ui-button underline-offset-4 hover:underline"
                                >
                                  {student.fullName}
                                </Link>
                              ))
                            : "Sin vínculos"}
                        </span>
                      </TableCell>
                      <TableCell>
                        {students[0] && (
                          <Link
                            aria-label={`Ver estudiantes de ${g.fullName}`}
                            href={`/students/${students[0].id}?tab=guardians`}
                            className="ui-button flex min-h-11 items-center justify-end"
                          >
                            <StudentIcon name="chevron" />
                          </Link>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          <ul className="divide-school-border divide-y md:hidden">
            {list.rows.map((g) => (
              <li key={g.id} className="space-y-2 p-5">
                <p className={styles.name}>{g.fullName}</p>
                <p className={styles.meta}>{g.email}</p>
                <p className="text-school-small">{g.phoneNumber || "Sin teléfono"}</p>
                {linkedGuardianStudents(s.directory.students, g.id).map((student) => (
                  <Link
                    key={student.id}
                    className="text-school-small ui-button block underline"
                    href={`/students/${student.id}?tab=guardians`}
                  >
                    {student.fullName}
                  </Link>
                ))}
              </li>
            ))}
          </ul>
        </>
      )}
      {list.total > 0 && <div className="flex-1" />}
      <SchoolPagination variant="school" {...list} onPage={list.setPage} />
    </section>
  );
}
