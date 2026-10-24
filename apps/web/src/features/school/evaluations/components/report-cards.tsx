import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ActionDialog } from "@/components/shared/action-dialog";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { SchoolPanel } from "../../components/school-ui";
import { useReportCardDialog } from "../hooks/use-report-card-dialog";
import { ReportCardDetail } from "./report-card-detail";
import type { EvaluationsState } from "../hooks/use-evaluations-workspace";
export function ReportCards({
  state: s,
  canPublish,
}: {
  state: EvaluationsState;
  canPublish: boolean;
}) {
  const d = useReportCardDialog(s);
  return (
    <div className="space-y-5">
      <SchoolPanel
        title="Boletas por estudiante"
        description="Consulta las notas registradas y las versiones publicadas. El sistema valida los requisitos antes de emitir cada boleta."
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Estudiante</TableHead>
              <TableHead>Notas registradas</TableHead>
              <TableHead>Versiones</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {s.reportCardsOverview.studentReadiness.map((student) => (
              <TableRow key={student.enrollmentId}>
                <TableCell>
                  <strong>{student.studentFullName}</strong>
                  <p className="text-muted mt-1 text-[11px]">{student.studentCode}</p>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      student.recordedSubjectsCount >= student.totalGradeSubjectsCount &&
                      student.totalGradeSubjectsCount > 0
                        ? "success"
                        : "warning"
                    }
                  >
                    {student.recordedSubjectsCount} de {student.totalGradeSubjectsCount} materias
                  </Badge>
                </TableCell>
                <TableCell>{student.latestPublishedVersion}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!student.latestSnapshotId}
                      onClick={() => {
                        d.setHistoryStudent(student.studentId);
                        if (student.latestSnapshotId)
                          s.setSelectedSnapshotId(student.latestSnapshotId);
                      }}
                    >
                      Historial
                    </Button>
                    {canPublish && (
                      <Button
                        size="sm"
                        disabled={
                          s.isSubmitting ||
                          !s.reportCardsOverview.activeEvaluationPolicyVersionId ||
                          student.recordedSubjectsCount === 0
                        }
                        onClick={() => d.open(student)}
                      >
                        {student.latestPublishedVersion ? "Rectificar" : "Publicar"}
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {!s.reportCardsOverview.studentReadiness.length && (
          <p className="text-muted p-8 text-xs">
            Selecciona una sección con estudiantes matriculados.
          </p>
        )}
      </SchoolPanel>
      <div className="grid items-start gap-5 xl:grid-cols-[280px_1fr]">
        <SchoolPanel
          title="Historial de versiones"
          actions={
            d.historyStudent ? (
              <Button size="sm" variant="ghost" onClick={() => d.setHistoryStudent(null)}>
                Todos
              </Button>
            ) : undefined
          }
        >
          <div className="divide-y divide-slate-100">
            {d.history.map((snapshot) => (
              <button
                key={snapshot.id}
                type="button"
                onClick={() => s.setSelectedSnapshotId(snapshot.id)}
                aria-pressed={s.selectedSnapshot?.id === snapshot.id}
                className={
                  "block w-full p-4 text-left text-xs " +
                  (s.selectedSnapshot?.id === snapshot.id
                    ? "bg-blue-50 text-blue-900"
                    : "hover:bg-slate-50")
                }
              >
                <strong className="block">{snapshot.studentFullName}</strong>
                <span className="text-muted mt-2 block">
                  Versión {snapshot.versionNumber} · {snapshot.periodCode}
                </span>
                <span className="text-muted mt-1 block text-[11px]">
                  {new Date(snapshot.publishedAtUtc).toLocaleDateString("es-DO")}
                </span>
              </button>
            ))}
            {!d.history.length && (
              <p className="text-muted p-5 text-xs">No hay boletas publicadas.</p>
            )}
          </div>
        </SchoolPanel>
        <ReportCardDetail state={s} />
      </div>
      <ActionDialog
        open={Boolean(d.student)}
        title={d.student?.latestPublishedVersion ? "Rectificar boleta" : "Publicar boleta"}
        busy={s.isSubmitting}
        onClose={d.close}
      >
        <p className="mb-4 text-sm font-semibold">{d.student?.studentFullName}</p>
        <p className="text-muted mb-5 text-xs leading-6">
          Se guardará una versión histórica del período {s.selectedPeriodCode}. Las versiones
          anteriores se conservarán.
        </p>
        {Boolean(d.student?.latestPublishedVersion) && (
          <label className="mb-5 block text-xs font-semibold text-slate-700">
            Motivo de rectificación *
            <Input
              className="mt-2"
              value={d.reason}
              onChange={(e) => d.setReason(e.target.value)}
              placeholder="Mínimo 10 caracteres"
            />
          </label>
        )}
        {d.error && (
          <p role="alert" className="mb-4 text-xs text-red-700">
            {d.error}
          </p>
        )}
        <div className="flex justify-end gap-3">
          <Button variant="outline" disabled={s.isSubmitting} onClick={d.close}>
            Cancelar
          </Button>
          <Button disabled={s.isSubmitting} onClick={() => void d.publish()}>
            {s.isSubmitting ? "Publicando…" : "Confirmar publicación"}
          </Button>
        </div>
      </ActionDialog>
    </div>
  );
}
