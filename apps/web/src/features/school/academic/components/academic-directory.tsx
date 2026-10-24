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
import { SchoolPanel } from "../../components/school-ui";
import { getEducationalStageMeta, getSchoolShiftMeta } from "../schemas/academic-schemas";
import type { AcademicState } from "../hooks/use-academic-workspace";
export function AcademicDirectory({
  view,
  state: s,
  canManage,
}: {
  view: string;
  state: AcademicState;
  canManage: boolean;
}) {
  if (view === "years")
    return (
      <SchoolPanel>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Año escolar</TableHead>
              <TableHead>Fechas</TableHead>
              <TableHead>Secciones</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Acción</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {s.overview.academicYears.map((y) => (
              <TableRow key={y.id}>
                <TableCell>
                  <strong>{y.code}</strong>
                  <p className="text-muted mt-1 text-xs">{y.name}</p>
                </TableCell>
                <TableCell>
                  {y.startDate} → {y.endDate}
                </TableCell>
                <TableCell>{y.sectionsCount}</TableCell>
                <TableCell>
                  <Badge variant={y.isClosed ? "secondary" : "success"}>
                    {y.isClosed ? "Cerrado" : "Abierto"}
                  </Badge>
                </TableCell>
                <TableCell>
                  {canManage && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={s.actionLoadingId === y.id}
                      onClick={() => s.handleToggleYearStatus(y.id, y.code, y.isClosed)}
                    >
                      {y.isClosed ? "Reabrir" : "Cerrar año"}
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {!s.overview.academicYears.length && (
          <p className="text-muted p-8 text-xs">Todavía no hay años escolares registrados.</p>
        )}
      </SchoolPanel>
    );
  if (view === "subjects")
    return (
      <SchoolPanel>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Materia</TableHead>
              <TableHead>Secciones asignadas</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {s.filteredSubjects.map((sub) => (
              <TableRow key={sub.id}>
                <TableCell>{sub.code}</TableCell>
                <TableCell>
                  <strong>{sub.name}</strong>
                </TableCell>
                <TableCell>{sub.assignedSectionsCount}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {!s.filteredSubjects.length && (
          <p className="text-muted p-8 text-xs">
            Crea las materias del catálogo para asignarlas a las secciones.
          </p>
        )}
      </SchoolPanel>
    );
  if (view === "assignments")
    return (
      <SchoolPanel>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Docente</TableHead>
              <TableHead>Materia</TableHead>
              <TableHead>Sección</TableHead>
              <TableHead>Año escolar</TableHead>
              <TableHead>Horas semanales</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {s.filteredAssignments.map((a) => (
              <TableRow key={a.id}>
                <TableCell>
                  <strong>{a.teacherDisplayName}</strong>
                  <p className="text-muted mt-1 text-[11px]">{a.teacherEmail}</p>
                </TableCell>
                <TableCell>{a.subjectName}</TableCell>
                <TableCell>
                  {a.gradeLevelName} {a.sectionCode}
                </TableCell>
                <TableCell>{a.academicYearCode}</TableCell>
                <TableCell>{a.weeklyHours}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {!s.filteredAssignments.length && (
          <p className="text-muted p-8 text-xs">No hay asignaciones docentes para este año.</p>
        )}
      </SchoolPanel>
    );
  return (
    <div className="space-y-5">
      <SchoolPanel
        title="Catálogo de grados"
        description="Los grados permanecen disponibles para organizar distintos años escolares."
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Grado</TableHead>
              <TableHead>Nivel</TableHead>
              <TableHead>Código</TableHead>
              <TableHead>Secciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {s.overview.gradeLevels.map((g) => (
              <TableRow key={g.id}>
                <TableCell>
                  <strong>{g.displayName}</strong>
                </TableCell>
                <TableCell>{getEducationalStageMeta(g.stage).shortLabel}</TableCell>
                <TableCell>{g.code}</TableCell>
                <TableCell>{g.sectionsCount}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {!s.overview.gradeLevels.length && (
          <p className="text-muted p-6 text-xs">Registra el primer grado del colegio.</p>
        )}
      </SchoolPanel>
      <SchoolPanel
        title="Secciones del año escolar"
        actions={
          canManage ? (
            <ButtonLink size="sm" href="/academic/sections/new">
              Crear sección
            </ButtonLink>
          ) : undefined
        }
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Grado y sección</TableHead>
              <TableHead>Año</TableHead>
              <TableHead>Tanda</TableHead>
              <TableHead>Capacidad</TableHead>
              <TableHead>Materias asignadas</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {s.filteredSections.map((sec) => (
              <TableRow key={sec.id}>
                <TableCell>
                  <strong>
                    {sec.gradeLevelName} {sec.code}
                  </strong>
                </TableCell>
                <TableCell>{sec.academicYearCode}</TableCell>
                <TableCell>{getSchoolShiftMeta(sec.shift).shortLabel}</TableCell>
                <TableCell>{sec.capacity}</TableCell>
                <TableCell>{sec.assignedSubjectsCount}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {!s.filteredSections.length && (
          <p className="text-muted p-6 text-xs">No hay secciones para este año escolar.</p>
        )}
      </SchoolPanel>
    </div>
  );
}
