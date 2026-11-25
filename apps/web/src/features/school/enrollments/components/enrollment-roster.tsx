import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
import { SchoolIcon } from "@/components/shared/school-icon";
import { SchoolPagination } from "../../components/school-pagination";
import { enrollmentSectionLabel, enrollmentDateLabel } from "../schemas/enrollment-selectors";
import type { EnrollmentsWorkspaceState } from "../hooks/use-enrollments-workspace";
import { EnrollmentIcon } from "./enrollment-icon";
import styles from "./enrollments.module.css";

export function EnrollmentRoster({ state: s }: { state: EnrollmentsWorkspaceState }) {
  return (
    <section className={styles.panel} aria-label="Estudiantes matriculados">
      <header className={styles.rosterHeader}>
        <div className="min-w-0 flex-1">
          <h2 className={styles.rosterTitle}>
            {s.selectedSection
              ? enrollmentSectionLabel(s.selectedSection)
              : "Estudiantes matriculados"}
          </h2>
          <p className={styles.description}>
            {s.selectedSection
              ? `${s.selectedSection.activeEnrollmentsCount} de ${s.selectedSection.capacity} cupos ocupados`
              : "Selecciona una sección para consultar sus matrículas."}
          </p>
        </div>
        <div className={styles.search}>
          <span className={styles.searchIcon}>
            <EnrollmentIcon name="search" />
          </span>
          <Input
            aria-label="Buscar en la sección"
            placeholder="Buscar en la sección"
            value={s.query}
            onChange={(event) => s.setQuery(event.target.value)}
            disabled={!s.selectedSection}
          />
        </div>
      </header>
      {s.pagination.total ? (
        <>
          <Table>
            <TableHeader className="school:bg-school-surface school:border-t-0">
              <TableRow>
                <TableHead>Estudiante</TableHead>
                <TableHead>Fecha de matrícula</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {s.pagination.rows.map((record) => (
                <TableRow key={record.id}>
                  <TableCell>
                    <span className="text-school-ink block font-semibold">
                      {s.data.canReadStudents ? (
                        <Link
                          href={`/students/${record.studentId}?tab=enrollments`}
                          className="ui-button underline-offset-4 hover:underline"
                        >
                          {record.studentFullName}
                        </Link>
                      ) : (
                        record.studentFullName
                      )}
                    </span>
                    <span className="text-school-secondary text-school-label block">
                      {record.studentCode}
                    </span>
                  </TableCell>
                  <TableCell>{enrollmentDateLabel(record.enrolledAtUtc)}</TableCell>
                  <TableCell>
                    <Badge variant="success">Activo</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="flex-1" />
          <SchoolPagination variant="school" {...s.pagination} onPage={s.setPage} />
        </>
      ) : (
        <EmptyState
          variant="school"
          icon={<SchoolIcon name="empty-students" />}
          title={
            !s.selectedSection
              ? "Selecciona una sección"
              : s.query
                ? "Sin estudiantes coincidentes"
                : "Esta sección aún no tiene estudiantes"
          }
          description={
            !s.selectedSection
              ? "Organiza las secciones del año escolar para comenzar a matricular."
              : s.query
                ? "Prueba otro nombre o código en esta sección."
                : "Matricula a un estudiante para que aparezca al pasar lista y registrar notas."
          }
          action={
            s.canEnroll && s.selectedSection && !s.query ? (
              <Button onClick={s.openPanel}>
                <SchoolIcon name="plus" />
                Matricular estudiante
              </Button>
            ) : undefined
          }
        />
      )}
    </section>
  );
}
