import { Input } from "@/components/ui/input";
import { SchoolIcon } from "@/components/shared/school-icon";
import { ProblemAlert } from "@/components/api/problem-alert";
import { SchoolSidePanel } from "../../components/school-side-panel";
import { SchoolFormField } from "../../components/school-form-field";
import type { EnrollmentsWorkspaceState } from "../hooks/use-enrollments-workspace";
import { enrollmentStudentLabel, enrollmentSectionLabel } from "../schemas/enrollment-selectors";
import { EnrollmentIcon } from "./enrollment-icon";
import styles from "./enrollments.module.css";

export function EnrollmentPanel({ state: s }: { state: EnrollmentsWorkspaceState }) {
  const studentId = s.id + "-student";
  const sectionId = s.id + "-section";
  const studentError = s.form.formState.errors.studentId?.message;
  return (
    <SchoolSidePanel
      title="Matricular estudiante"
      subtitle={`Año escolar ${s.selectedYear?.code ?? "no disponible"}`}
      titleId={s.id + "-panel-title"}
      busy={s.busy}
      onClose={s.closePanel}
      onSubmit={s.submit}
      submitLabel="Matricular"
      submitDisabled={!s.eligibleStudents.length || !s.availableSections.length}
    >
      {s.formProblem && <ProblemAlert problem={s.formProblem} />}
      <SchoolFormField
        id={studentId}
        label="Estudiante"
        error={studentError}
        hint="Solo aparecen estudiantes activos sin matrícula en este año."
      >
        <div className={styles.fieldIcon}>
          <span>
            <SchoolIcon name="search" />
          </span>
          <Input
            id={studentId}
            name="studentSearch"
            list={s.id + "-students"}
            autoComplete="off"
            placeholder="Buscar por nombre, código o SIGERD"
            value={s.studentQuery}
            onChange={(event) => s.changeStudent(event.target.value)}
            disabled={s.busy}
            aria-invalid={!!studentError}
            aria-describedby={`${studentId}-hint${studentError ? ` ${studentId}-error` : ""}`}
          />
        </div>
        <input type="hidden" {...s.form.register("studentId")} />
        <datalist id={s.id + "-students"}>
          {s.eligibleStudents.map((student) => (
            <option key={student.id} value={enrollmentStudentLabel(student)} />
          ))}
        </datalist>
      </SchoolFormField>
      {!s.eligibleStudents.length && (
        <p className="text-school-small text-school-secondary">
          No hay expedientes disponibles para matricular en este año.
        </p>
      )}
      <SchoolFormField
        id={sectionId}
        label="Sección"
        error={s.form.formState.errors.sectionId?.message}
        hint={
          s.formSection
            ? `${s.formSection.availableSeats} cupos disponibles`
            : "Solo se muestran secciones abiertas con cupos."
        }
      >
        <div className={styles.selectWrap}>
          <select
            id={sectionId}
            className={styles.select}
            {...s.form.register("sectionId")}
            disabled={s.busy}
            aria-invalid={!!s.form.formState.errors.sectionId}
            aria-describedby={`${sectionId}-hint${s.form.formState.errors.sectionId ? ` ${sectionId}-error` : ""}`}
          >
            <option value="">Seleccionar sección</option>
            {s.availableSections.map((section) => (
              <option key={section.sectionId} value={section.sectionId}>
                {enrollmentSectionLabel(section)}
              </option>
            ))}
          </select>
          <span className={styles.selectIcon}>
            <EnrollmentIcon name="down" />
          </span>
        </div>
      </SchoolFormField>
      <SchoolFormField id={s.id + "-date"} label="Fecha de matrícula">
        <div className={styles.readonlyField}>
          <Input
            id={s.id + "-date"}
            value="Se registra automáticamente al matricular"
            readOnly
            className="text-sm"
          />
          <span>
            <EnrollmentIcon name="calendar" />
          </span>
        </div>
      </SchoolFormField>
    </SchoolSidePanel>
  );
}
