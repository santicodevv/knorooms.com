import { SchoolPanel } from "../../components/school-ui";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { EvaluationsState } from "../hooks/use-evaluations-workspace";
export function ReportCardDetail({ state: s }: { state: EvaluationsState }) {
  const payload = s.selectedSnapshotPayload,
    snapshot = s.selectedSnapshot;
  if (!payload || !snapshot)
    return (
      <SchoolPanel>
        <p className="text-muted p-10 text-center text-xs">
          Selecciona una versión para consultar su contenido histórico.
        </p>
      </SchoolPanel>
    );
  return (
    <SchoolPanel
      title={"Boleta de " + payload.studentFullName}
      description={
        payload.academicYearName +
        " · " +
        payload.gradeName +
        " " +
        payload.sectionName +
        " · " +
        payload.periodCode
      }
      actions={<Badge>Versión {snapshot.versionNumber}</Badge>}
    >
      <div className="grid gap-4 border-b border-slate-200 p-5 text-xs sm:grid-cols-2">
        <div>
          <p className="text-muted">Institución</p>
          <strong className="mt-1 block">{payload.institutionName}</strong>
        </div>
        <div>
          <p className="text-muted">Expediente</p>
          <strong className="mt-1 block">{payload.studentCode}</strong>
        </div>
        <div>
          <p className="text-muted">Política aplicada</p>
          <strong className="mt-1 block">
            {payload.policyName} · v{payload.policyVersion}
          </strong>
        </div>
        <div>
          <p className="text-muted">Promedio y condición</p>
          <strong className="mt-1 block">
            {payload.averageScore.toFixed(2)} · {payload.academicStanding}
          </strong>
        </div>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Materia</TableHead>
            <TableHead>Nota</TableHead>
            <TableHead>Resultado</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payload.subjects.map((sub) => (
            <TableRow key={sub.subjectId}>
              <TableCell>{sub.subjectName}</TableCell>
              <TableCell>{sub.numericScore.toFixed(2)}</TableCell>
              <TableCell>{sub.isPassing ? "Aprobatorio" : "Bajo la mínima"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <footer className="text-muted space-y-2 border-t border-slate-200 p-5 text-xs leading-6">
        <p>
          Asistencia: {payload.attendance.presentDays} presentes · {payload.attendance.absentDays}{" "}
          ausencias · {payload.attendance.lateDays} tardanzas · {payload.attendance.excusedDays}{" "}
          excusas.
        </p>
        <p>
          Publicó: {snapshot.publishedByDisplayName} ·{" "}
          {new Date(snapshot.publishedAtUtc).toLocaleString("es-DO")}
        </p>
        {snapshot.correctionReason && <p>Motivo de rectificación: {snapshot.correctionReason}</p>}
        <p>Esta versión conserva el contenido publicado. Una rectificación genera otra versión.</p>
      </footer>
    </SchoolPanel>
  );
}
