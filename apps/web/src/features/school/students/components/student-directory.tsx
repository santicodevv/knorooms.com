import { StudentDirectoryCards } from "./student-directory-cards";
import { studentProfileHref } from "../student-navigation";
import Link from "next/link";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";
import { SchoolPanel, schoolSelectClass } from "../../components/school-ui";
import { SchoolPagination } from "../../components/school-pagination";
import { useSchoolList } from "../../hooks/use-school-list";
import type { ReturnTypeOfStudents, StudentStatusFilter } from "../hooks/use-students-workspace";
export function StudentDirectory({ state: s }: { state: ReturnTypeOfStudents }) {
  const list = useSchoolList(s.filteredStudents);
  return (
    <SchoolPanel>
      <div className="flex flex-wrap gap-3 p-5">
        <div className="relative min-w-48 flex-1">
          <Search className="text-muted absolute top-3 left-3 size-4" />
          <Input
            aria-label="Buscar estudiantes"
            placeholder="Buscar nombre, código o SIGERD"
            className="pl-9"
            value={s.studentSearchQuery}
            onChange={(e) => {
              s.setStudentSearchQuery(e.target.value);
              list.setPage(1);
            }}
          />
        </div>
        <select
          aria-label="Estado del estudiante"
          className={schoolSelectClass + " sm:max-w-52"}
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
      </div>
      {list.total === 0 ? (
        <div className="p-8">
          <EmptyState
            title="Sin estudiantes coincidentes"
            description="Prueba otra búsqueda o crea el primer expediente."
          />
        </div>
      ) : (
        <>
          <StudentDirectoryCards
            students={list.rows}
            query={s.studentSearchQuery}
            status={s.studentStatusFilter}
            page={list.page}
          />
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Estudiante</TableHead>
                  <TableHead>Código de expediente</TableHead>
                  <TableHead>Matrícula actual</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Acción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.rows.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell>
                      <Link
                        href={studentProfileHref(
                          student.id,
                          s.studentSearchQuery,
                          s.studentStatusFilter,
                          list.page,
                        )}
                        className="flex items-center gap-3"
                      >
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-blue-800">
                          {student.firstName[0]}
                          {student.lastName[0]}
                        </span>
                        <span>
                          <strong className="block text-xs text-slate-900">
                            {student.fullName}
                          </strong>
                          <small className="text-muted mt-1 block text-[11px]">
                            {student.sigerdExternalId
                              ? "SIGERD: " + student.sigerdExternalId
                              : "Sin ID externo SIGERD"}
                          </small>
                        </span>
                      </Link>
                    </TableCell>
                    <TableCell>{student.studentCode}</TableCell>
                    <TableCell>
                      {student.latestEnrollment?.status === "Active" ? (
                        student.latestEnrollment.gradeLevelName +
                        " · " +
                        student.latestEnrollment.sectionCode
                      ) : (
                        <Badge variant="warning">Pendiente</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={student.isActive ? "success" : "secondary"}>
                        {student.isActive ? "Activo" : "Inactivo"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <ButtonLink
                        size="sm"
                        variant="outline"
                        href={studentProfileHref(
                          student.id,
                          s.studentSearchQuery,
                          s.studentStatusFilter,
                          list.page,
                        )}
                      >
                        Ver ficha
                      </ButtonLink>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}
      <SchoolPagination {...list} onPage={list.setPage} />
    </SchoolPanel>
  );
}
