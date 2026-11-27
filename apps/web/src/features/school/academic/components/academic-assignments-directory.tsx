import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { SchoolIcon } from "@/components/shared/school-icon";
import { SegmentedControl } from "@/components/ui/segmented-control";
import {
  Table,
  TableHeader,
  TableHead,
  TableRow,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { getInitials } from "../schemas/academic-schemas";
import { AcademicYearFilter } from "./academic-filters";
import { AcademicIcon } from "./academic-icon";
import type { AcademicState } from "../hooks/use-academic-workspace";
import styles from "./academic.module.css";
export function AcademicAssignmentsDirectory({
  state: s,
  canManage,
}: {
  state: AcademicState;
  canManage: boolean;
}) {
  return (
    <>
      <div className={styles.filters}>
        <AcademicYearFilter state={s} />
        {s.filteredAssignments.length > 0 && (
          <SegmentedControl
            name="assignment-view"
            label="Agrupación de carga docente"
            options={[
              { value: "section", label: "Por sección" },
              { value: "teacher", label: "Por docente" },
            ]}
            value={s.assignmentView}
            onValueChange={s.setAssignmentView}
          />
        )}
      </div>
      {!s.filteredAssignments.length ? (
        <section className={styles.surface}>
          <EmptyState
            variant="school"
            icon={<AcademicIcon name="empty-teachers" />}
            title="Aún no hay docentes asignados"
            description="Asigna un docente a una materia y sección para que pueda pasar lista y registrar notas."
            action={
              canManage ? (
                <Button onClick={() => s.toggleDrawer("assignment")}>
                  <SchoolIcon name="plus" />
                  Asignar docente
                </Button>
              ) : undefined
            }
          />
        </section>
      ) : s.assignmentView === "teacher" ? (
        <div className="flex flex-col gap-3">
          {s.teacherGroups.map((group) => (
            <section
              className="bg-school-surface rounded-school-card overflow-hidden"
              key={group.teacherMembershipId}
            >
              <header className={styles.teacherHeader}>
                <span aria-hidden="true" className={styles.teacherAvatar}>
                  {getInitials(group.teacherDisplayName)}
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="text-school-body font-semibold">{group.teacherDisplayName}</h2>
                  <p className="text-school-label text-school-secondary mt-1">
                    {group.assignments.length} asignaciones · {group.weeklyHours} h semanales
                  </p>
                </div>
                {canManage && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      s.assignmentForm.setValue("teacherMembershipId", group.teacherMembershipId);
                      s.toggleDrawer("assignment");
                    }}
                  >
                    <AcademicIcon name="plus-dark-small" />
                    Asignar materia
                  </Button>
                )}
              </header>
              {group.assignments.map((item) => (
                <div key={item.id} className={styles.teacherAssignment}>
                  <p className="font-semibold">{item.subjectName}</p>
                  <p className="text-school-secondary">
                    {item.gradeLevelName} {item.sectionCode}
                  </p>
                  <p className="text-school-secondary">{item.weeklyHours} h</p>
                </div>
              ))}
            </section>
          ))}
        </div>
      ) : (
        <section className="bg-school-surface rounded-school-card overflow-hidden">
          <div className="hidden md:block">
            <Table className={styles.table}>
              <TableHeader className="school:bg-school-surface school:border-t-0">
                <TableRow>
                  <TableHead>Sección</TableHead>
                  <TableHead>Materia</TableHead>
                  <TableHead>Docente</TableHead>
                  <TableHead>Horas semanales</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {s.filteredAssignments.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-semibold">
                      {item.gradeLevelName} {item.sectionCode}
                    </TableCell>
                    <TableCell>{item.subjectName}</TableCell>
                    <TableCell>{item.teacherDisplayName}</TableCell>
                    <TableCell>{item.weeklyHours} h</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <ul className="divide-school-border divide-y md:hidden">
            {s.filteredAssignments.map((item) => (
              <li className="space-y-1 p-5" key={item.id}>
                <p className="text-school-body font-semibold">{item.subjectName}</p>
                <p className="text-school-small">
                  {item.gradeLevelName} {item.sectionCode}
                </p>
                <p className="text-school-small text-school-secondary">
                  {item.teacherDisplayName} · {item.weeklyHours} h semanales
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
