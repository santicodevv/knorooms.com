import { Button, ButtonLink } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { SchoolPanel, schoolSelectClass } from "../../components/school-ui";
import { SchoolPagination } from "../../components/school-pagination";
import { useSchoolList } from "../../hooks/use-school-list";
import { getEnrollmentStatusMeta } from "../schemas/students-schemas";
import type { ReturnTypeOfStudents } from "../hooks/use-students-workspace";
export function EnrollmentDirectory({
  state: s,
  canManage,
}: {
  state: ReturnTypeOfStudents;
  canManage: boolean;
}) {
  const list = useSchoolList(s.filteredEnrollments);
  return (
    <div className="space-y-5">
      <SchoolPanel
        title="Cupos por sección"
        description="Capacidad y matrículas vigentes por año escolar."
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Sección</TableHead>
              <TableHead>Año escolar</TableHead>
              <TableHead>Capacidad</TableHead>
              <TableHead>Vigentes</TableHead>
              <TableHead>Disponibles</TableHead>
              <TableHead>Ocupación</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {s.enrollmentsOverview.sectionCapacities.map((sec) => (
              <TableRow key={sec.sectionId}>
                <TableCell>
                  <strong>
                    {sec.gradeLevelName} {sec.sectionCode}
                  </strong>
                </TableCell>
                <TableCell>{sec.academicYearCode}</TableCell>
                <TableCell>{sec.capacity}</TableCell>
                <TableCell>{sec.activeEnrollmentsCount}</TableCell>
                <TableCell>{sec.availableSeats}</TableCell>
                <TableCell>
                  <div className="min-w-28">
                    <progress
                      aria-label={"Ocupación de " + sec.gradeLevelName + " " + sec.sectionCode}
                      className="h-1.5 w-full accent-blue-600"
                      max={sec.capacity}
                      value={sec.activeEnrollmentsCount}
                    />
                    <p className="text-muted mt-1 text-[11px]">
                      {sec.capacity
                        ? Math.round((sec.activeEnrollmentsCount / sec.capacity) * 100)
                        : 0}
                      %
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {s.enrollmentsOverview.sectionCapacities.length === 0 && (
          <p className="text-muted p-6 text-xs">
            Crea secciones en Organización académica para disponer de cupos.
          </p>
        )}
      </SchoolPanel>
      <SchoolPanel
        title="Nómina de matrículas"
        actions={
          <select
            aria-label="Filtrar matrículas por sección"
            className={schoolSelectClass + " max-w-64"}
            value={s.selectedSectionFilterId}
            onChange={(e) => {
              s.setSelectedSectionFilterId(e.target.value);
              list.setPage(1);
            }}
          >
            <option value="all">Todas las secciones</option>
            {s.enrollmentsOverview.sectionCapacities.map((sec) => (
              <option key={sec.sectionId} value={sec.sectionId}>
                {sec.academicYearCode} · {sec.gradeLevelName} {sec.sectionCode}
              </option>
            ))}
          </select>
        }
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Estudiante</TableHead>
              <TableHead>Año y sección</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.rows.map((e) => (
              <TableRow key={e.id}>
                <TableCell>
                  <strong>{e.studentFullName}</strong>
                  <p className="text-muted mt-1 text-[11px]">{e.studentCode}</p>
                </TableCell>
                <TableCell>
                  {e.academicYearCode} · {e.gradeLevelName} {e.sectionCode}
                </TableCell>
                <TableCell>
                  <Badge variant={e.status === "Active" ? "success" : "secondary"}>
                    {getEnrollmentStatusMeta(e.status).shortLabel}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <ButtonLink
                      size="sm"
                      variant="outline"
                      href={"/students/" + e.studentId + "?tab=enrollments"}
                    >
                      Ver ficha
                    </ButtonLink>
                    {canManage && e.status === "Active" && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => s.openTransferForEnrollment(e)}
                        >
                          Trasladar
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={s.isPending}
                          onClick={() => s.handleWithdrawEnrollment(e.id, e.studentFullName)}
                        >
                          Retirar
                        </Button>
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {!list.total && (
          <p className="text-muted p-6 text-xs">No hay matrículas para esta selección.</p>
        )}
        <SchoolPagination {...list} onPage={list.setPage} />
      </SchoolPanel>
    </div>
  );
}
