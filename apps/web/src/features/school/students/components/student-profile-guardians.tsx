import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { StudentIcon } from "./student-icon";
import { studentInitials } from "../schemas/student-directory";
import type { ReturnTypeOfStudents } from "../hooks/use-students-workspace";
import styles from "./students.module.css";
export function StudentProfileGuardians({
  state: s,
  canManage,
}: {
  state: ReturnTypeOfStudents;
  canManage: boolean;
}) {
  const student = s.selectedStudent;
  if (!student) return null;
  return (
    <section aria-label="Responsables del estudiante" className="space-y-4">
      {student.guardians.length ? (
        student.guardians.map((g) => (
          <article key={g.linkId} className={styles.guardianCard}>
            <span className={styles.avatar}>{studentInitials(g.fullName)}</span>
            <div className="min-w-0 flex-1">
              <h2 className="text-school-body font-semibold">{g.fullName}</h2>
              <p className="text-school-small text-school-secondary mt-1 break-words">
                {g.relationshipType} · {g.email}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {g.hasAcademicAccess && <Badge variant="secondary">Acceso académico</Badge>}
              {g.hasFinancialResponsibility && (
                <Badge variant="secondary">Responsabilidad financiera</Badge>
              )}
              {g.hasPickupAuthorization && <Badge variant="secondary">Recogida autorizada</Badge>}
            </div>
          </article>
        ))
      ) : (
        <div className="bg-school-surface rounded-school-card">
          <EmptyState
            variant="school"
            title="Sin responsables vinculados"
            description="Vincula un responsable registrado al expediente."
          />
        </div>
      )}
      {canManage && (
        <div className="flex flex-wrap gap-3">
          <Button disabled={s.isPending} onClick={() => s.toggleDrawer("link-guardian")}>
            <StudentIcon name="plus" />
            Vincular responsable
          </Button>
          <Button
            disabled={s.isPending}
            variant="outline"
            onClick={() => s.toggleDrawer("guardian")}
          >
            Nuevo responsable
          </Button>
        </div>
      )}
    </section>
  );
}
