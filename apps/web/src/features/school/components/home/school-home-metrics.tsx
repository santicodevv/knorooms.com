import styles from "./school-home.module.css";
export function SchoolHomeMetrics({
  students,
  enrollments,
  sections,
  seats,
  yearCode,
}: {
  students: number | null;
  enrollments: number | null;
  sections: number | null;
  seats: number | null;
  yearCode?: string;
}) {
  const items = [
    { label: "Estudiantes activos", value: students, note: "Expedientes permanentes" },
    {
      label: "Matrículas vigentes",
      value: enrollments,
      note: yearCode ?? "Sin año escolar seleccionado",
    },
    { label: "Secciones habilitadas", value: sections, note: "Para el año seleccionado" },
    { label: "Cupos disponibles", value: seats, note: "Según la capacidad registrada" },
  ];
  return (
    <dl className="bg-school-surface divide-school-border rounded-school-card grid grid-cols-2 overflow-hidden xl:grid-cols-4 xl:divide-x">
      {items.map((item) => (
        <div key={item.label} className={styles.metric}>
          <dt className="text-school-secondary text-school-small font-medium">{item.label}</dt>
          <dd className={styles.metricValue}>
            {item.value === null ? (
              <span aria-label="Información no disponible">—</span>
            ) : (
              item.value
            )}
          </dd>
          <dd className="text-school-muted text-school-label mt-1 font-normal">{item.note}</dd>
        </div>
      ))}
    </dl>
  );
}
