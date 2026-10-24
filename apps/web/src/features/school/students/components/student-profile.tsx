import { Button, ButtonLink } from "@/components/ui/button";
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
import { SchoolPanel } from "../../components/school-ui";
import { useStudentProfile } from "../hooks/use-student-profile";
import { getEnrollmentStatusMeta, calculateStudentAge } from "../schemas/students-schemas";
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
  const { tab, setTab } = useStudentProfile(),
    student = s.selectedStudent;
  if (!student) return <EmptyState title="Expediente no encontrado" />;
  const enrollments = s.enrollmentsOverview.enrollments.filter((e) => e.studentId === student.id);
  return (
    <SchoolPanel>
      <header className="flex flex-wrap items-center gap-4 p-6">
        <span className="flex size-14 items-center justify-center rounded-full bg-blue-50 text-lg font-bold text-blue-800">
          {student.firstName[0]}
          {student.lastName[0]}
        </span>
        <div className="flex-1">
          <h2 className="text-base font-bold text-slate-900">{student.fullName}</h2>
          <p className="text-muted mt-1 text-xs">
            {student.studentCode} · {calculateStudentAge(student.birthDate)} años
          </p>
        </div>
        <Badge variant={student.isActive ? "success" : "secondary"}>
          {student.isActive ? "Activo" : "Inactivo"}
        </Badge>
        {canManageStudents && (
          <Button
            size="sm"
            variant="outline"
            disabled={s.isPending}
            onClick={() =>
              s.handleToggleStudentActive(student.id, student.studentCode, student.isActive)
            }
          >
            {student.isActive ? "Desactivar expediente" : "Activar expediente"}
          </Button>
        )}
      </header>
      <nav
        aria-label="Ficha del estudiante"
        className="flex gap-6 overflow-x-auto border-y border-slate-200 px-6"
      >
        {[
          { key: "summary", label: "Resumen" },
          { key: "guardians", label: "Responsables" },
          { key: "enrollments", label: "Matrículas" },
        ].map((t) => (
          <button
            type="button"
            key={t.key}
            onClick={() => setTab(t.key)}
            aria-current={tab === t.key ? "page" : undefined}
            className={
              "shrink-0 border-b-2 py-4 text-xs font-semibold " +
              (tab === t.key ? "border-blue-600 text-blue-700" : "text-muted border-transparent")
            }
          >
            {t.label}
          </button>
        ))}
      </nav>
      <div className="p-6">
        {tab === "summary" ? (
          <>
            <dl className="grid gap-x-10 gap-y-6 sm:grid-cols-2">
              {[
                ["Nombre completo", student.fullName],
                ["Código", student.studentCode],
                ["Fecha de nacimiento", student.birthDate],
                ["Identificador externo SIGERD", student.sigerdExternalId ?? "No registrado"],
                [
                  "Situación académica",
                  student.latestEnrollment?.status === "Active"
                    ? student.latestEnrollment.gradeLevelName +
                      " · " +
                      student.latestEnrollment.sectionCode
                    : "Sin matrícula vigente",
                ],
                ["Responsables vinculados", student.guardians.length],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="text-muted text-xs">{label}</dt>
                  <dd className="mt-2 text-sm font-semibold text-slate-800">{value}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-7 rounded-lg border border-blue-200 bg-blue-50 p-4 text-xs leading-6 text-blue-900">
              El expediente se conserva a través de los años. La matrícula lo vincula con una
              sección y un año escolar.
            </p>
          </>
        ) : tab === "guardians" ? (
          <div className="space-y-4">
            {student.guardians.length ? (
              student.guardians.map((g) => (
                <div key={g.linkId} className="rounded-xl border border-slate-200 p-4">
                  <h3 className="text-sm font-semibold">{g.fullName}</h3>
                  <p className="text-muted mt-1 text-xs">
                    {g.relationshipType} · {g.email}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {g.hasAcademicAccess && <Badge>Acceso académico</Badge>}
                    {g.hasFinancialResponsibility && <Badge>Responsabilidad financiera</Badge>}
                    {g.hasPickupAuthorization && <Badge>Recogida autorizada</Badge>}
                  </div>
                </div>
              ))
            ) : (
              <EmptyState title="Sin responsables vinculados" />
            )}
            {canManageStudents && (
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => s.toggleDrawer("link-guardian")}>
                  Vincular responsable
                </Button>
                <ButtonLink href="/guardians/new" variant="outline">
                  Nuevo responsable
                </ButtonLink>
              </div>
            )}
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Año escolar</TableHead>
                  <TableHead>Sección</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {enrollments.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell>{e.academicYearCode}</TableCell>
                    <TableCell>
                      {e.gradeLevelName} {e.sectionCode}
                    </TableCell>
                    <TableCell>
                      <Badge variant={e.status === "Active" ? "success" : "secondary"}>
                        {getEnrollmentStatusMeta(e.status).shortLabel}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {canManageEnrollments && e.status === "Active" ? (
                        <div className="flex gap-2">
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
                        </div>
                      ) : (
                        "Consulta histórica"
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {!enrollments.length && <EmptyState title="Sin matrículas registradas" />}
            {canManageEnrollments && student.isActive && (
              <Button className="mt-5" onClick={() => s.openQuickEnrollForStudent(student.id)}>
                Matricular estudiante
              </Button>
            )}
          </>
        )}
      </div>
    </SchoolPanel>
  );
}
