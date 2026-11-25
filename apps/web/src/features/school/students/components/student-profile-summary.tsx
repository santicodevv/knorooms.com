import type { StudentDto } from "@/lib/api/types";
import { formatStudentDate } from "../schemas/student-directory";
import styles from "./students.module.css";
export function StudentProfileSummary({ student }: { student: StudentDto }) {
  const items = [
    ["Nombre completo", student.fullName],
    ["Código de expediente", student.studentCode],
    ["Fecha de nacimiento", formatStudentDate(student.birthDate)],
    ["Identificador SIGERD", student.sigerdExternalId || "No registrado"],
    [
      "Situación académica",
      student.latestEnrollment?.status === "Active"
        ? student.latestEnrollment.gradeLevelName + " · " + student.latestEnrollment.sectionCode
        : "Sin matrícula vigente",
    ],
    ["Responsables vinculados", String(student.guardians.length)],
  ];
  return (
    <section className={styles.summary} aria-label="Resumen del estudiante">
      <dl>
        {items.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      <p className={styles.note}>
        El expediente se conserva a través de los años. La matrícula lo vincula con una sección y un
        año escolar.
      </p>
    </section>
  );
}
