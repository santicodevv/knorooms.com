import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { SchoolIcon } from "@/components/shared/school-icon";
import {
  Table,
  TableHeader,
  TableHead,
  TableRow,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { SchoolPagination } from "../../components/school-pagination";
import { useStudentDirectory } from "../../students/hooks/use-student-directory";
import { AcademicIcon } from "./academic-icon";
import type { AcademicState } from "../hooks/use-academic-workspace";
import styles from "./academic.module.css";
export function AcademicSubjectsDirectory({
  state: s,
  canManage,
}: {
  state: AcademicState;
  canManage: boolean;
}) {
  const list = useStudentDirectory(s.filteredSubjects);
  return (
    <section className={styles.surface}>
      <div className="border-school-border border-b">
        <div className={styles.search}>
          <span>
            <SchoolIcon name="search" />
          </span>
          <Input
            aria-label="Buscar materias"
            placeholder="Buscar código o nombre de materia"
            value={s.subjectSearchQuery}
            onChange={(e) => {
              s.setSubjectSearchQuery(e.target.value);
              list.setPage(1);
            }}
          />
        </div>
      </div>
      {!list.total ? (
        <EmptyState
          variant="school"
          icon={<AcademicIcon name="empty-subjects" />}
          title={s.subjectSearchQuery ? "Sin materias coincidentes" : "Aún no hay materias"}
          description={
            s.subjectSearchQuery
              ? "Prueba otro código o nombre."
              : "Registra las asignaturas para poder asignarlas a docentes y secciones."
          }
          action={
            canManage ? (
              <Button onClick={() => s.toggleDrawer("subject")}>
                <SchoolIcon name="plus" />
                Registrar materia
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
          <div className="hidden md:block">
            <Table className={styles.table}>
              <colgroup>
                <col className="w-[200px]" />
                <col />
                <col className="w-20" />
              </colgroup>
              <TableHeader className="school:bg-school-surface school:border-t-0">
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>
                    <span className="sr-only">Consultar carga docente</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.rows.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-semibold">{item.code}</TableCell>
                    <TableCell>{item.name}</TableCell>
                    <TableCell>
                      <Link
                        href="/academic/assignments"
                        aria-label={`Consultar carga docente desde ${item.name}`}
                        className="ui-button flex min-h-8 items-center justify-end"
                      >
                        <SchoolIcon name="chevron" />
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <ul className="divide-school-border divide-y md:hidden">
            {list.rows.map((item) => (
              <li key={item.id} className="space-y-1 p-5">
                <p className="text-school-body font-semibold">{item.name}</p>
                <p className="text-school-small text-school-secondary">
                  {item.code} · {item.assignedSectionsCount} secciones asignadas
                </p>
              </li>
            ))}
          </ul>
          <div className="flex-1" />
        </>
      )}
      {list.pages > 1 && <SchoolPagination variant="school" {...list} onPage={list.setPage} />}
    </section>
  );
}
