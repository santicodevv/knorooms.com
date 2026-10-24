import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";
import { ButtonLink } from "@/components/ui/button";
import { SchoolPanel } from "../../components/school-ui";
import { SchoolPagination } from "../../components/school-pagination";
import { useSchoolList } from "../../hooks/use-school-list";
import type { ReturnTypeOfStudents } from "../hooks/use-students-workspace";
export function GuardianDirectory({ state: s }: { state: ReturnTypeOfStudents }) {
  const list = useSchoolList(s.directory.guardians);
  return (
    <SchoolPanel>
      {!list.total ? (
        <div className="p-8">
          <EmptyState title="Sin responsables registrados" />
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Responsable</TableHead>
              <TableHead>Contacto</TableHead>
              <TableHead>Estudiantes vinculados</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.rows.map((g) => (
              <TableRow key={g.id}>
                <TableCell>
                  <strong className="text-xs">{g.fullName}</strong>
                </TableCell>
                <TableCell>
                  <p>{g.email}</p>
                  <p className="text-muted mt-1 text-[11px]">{g.phoneNumber ?? "Sin teléfono"}</p>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-2">
                    {s.directory.students
                      .filter((student) =>
                        student.guardians.some((link) => link.guardianId === g.id),
                      )
                      .map((student) => (
                        <ButtonLink
                          key={student.id}
                          size="sm"
                          variant="outline"
                          href={"/students/" + student.id + "?tab=guardians"}
                        >
                          {student.fullName}
                        </ButtonLink>
                      ))}
                    {g.linkedStudentsCount === 0 && <Badge variant="secondary">Sin vínculos</Badge>}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      <SchoolPagination {...list} onPage={list.setPage} />
    </SchoolPanel>
  );
}
