import { Button, ButtonLink } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import type { EvaluationsState } from "../hooks/use-evaluations-workspace";
export function Gradebook({
  state: s,
  canRecord,
  canApprove,
}: {
  state: EvaluationsState;
  canRecord: boolean;
  canApprove: boolean;
}) {
  const policy = s.gradingOverview.activePolicy;
  return (
    <>
      <p
        className={
          "mb-4 rounded-xl border p-4 text-xs leading-6 " +
          (policy
            ? "border-blue-200 bg-blue-50 text-blue-900"
            : "border-amber-200 bg-amber-50 text-amber-900")
        }
      >
        {policy
          ? "Política aplicable: " +
            policy.name +
            ". La aprobación requiere una persona diferente de quien registra la nota."
          : "Configura la política de evaluación del año antes de guardar o aprobar notas."}{" "}
        <ButtonLink href="/settings/policies" variant="link" size="sm">
          Ver políticas
        </ButtonLink>
      </p>
      <SchoolPanel
        title={"Libro de notas · " + (s.gradingOverview.selectedSubjectName ?? "Sin materia")}
        description={
          (s.gradingOverview.selectedSectionLabel ?? "Sin sección") + " · " + s.selectedPeriodCode
        }
        actions={
          canRecord ? (
            <Button
              disabled={
                s.isSubmitting || !policy || !s.effectiveGradebookRows.some((r) => r.isDirty)
              }
              onClick={() => void s.handleSaveGradesBatch()}
            >
              {s.isSubmitting ? "Guardando…" : "Guardar calificaciones"}
            </Button>
          ) : undefined
        }
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Estudiante</TableHead>
              <TableHead>Períodos anteriores</TableHead>
              <TableHead>Nota (0–100)</TableHead>
              <TableHead>Resultado</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Revisión</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {s.effectiveGradebookRows.map((row) => (
              <TableRow key={row.enrollmentId}>
                <TableCell>
                  <strong>{row.studentFullName}</strong>
                  <p className="text-muted mt-1 text-[11px]">{row.studentCode}</p>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {["P1", "P2", "P3", "P4"].map((p) => (
                      <span
                        key={p}
                        className="rounded border border-slate-200 px-2 py-1 text-[11px]"
                      >
                        {p}: {row.periodScores[p] ?? "—"}
                      </span>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  <Input
                    aria-label={"Nota de " + row.studentFullName}
                    type="number"
                    min={0}
                    max={100}
                    step="0.01"
                    className="w-24"
                    value={row.draftScoreInput}
                    disabled={!canRecord || s.isSubmitting || !policy}
                    onChange={(e) => s.handleSetGradeDraftScore(row.enrollmentId, e.target.value)}
                  />
                  {row.isDirty && <p className="mt-1 text-[11px] text-amber-800">Sin guardar</p>}
                </TableCell>
                <TableCell>
                  {row.effectiveIsPassing === null ? (
                    "Sin nota"
                  ) : (
                    <Badge variant={row.effectiveIsPassing ? "success" : "warning"}>
                      {row.effectiveIsPassing ? "Aprobatorio" : "Bajo la mínima"}
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant={row.status === "Approved" ? "success" : "secondary"}>
                    {row.status === "Published"
                      ? "Publicada"
                      : row.status === "Approved"
                        ? "Aprobada"
                        : row.status === "Submitted"
                          ? "En revisión"
                          : row.status === "Draft"
                            ? "Borrador"
                            : "Sin registro"}
                  </Badge>
                  {row.recordedByDisplayName && (
                    <p className="text-muted mt-2 text-[11px]">
                      Registró: {row.recordedByDisplayName}
                    </p>
                  )}
                  {row.approvedByDisplayName && (
                    <p className="text-muted mt-1 text-[11px]">
                      Aprobó: {row.approvedByDisplayName}
                    </p>
                  )}
                </TableCell>
                <TableCell>
                  {(row.requiresCorrectionReason || row.correctionReason) && (
                    <Input
                      aria-label={"Motivo de corrección de " + row.studentFullName}
                      placeholder="Motivo de corrección"
                      value={row.draftCorrectionReason}
                      disabled={!canRecord || s.isSubmitting}
                      onChange={(e) =>
                        s.handleSetGradeCorrectionReason(row.enrollmentId, e.target.value)
                      }
                    />
                  )}{" "}
                  {canApprove && row.gradeEntryId && row.status === "Draft" && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={s.isSubmitting || row.isDirty}
                      onClick={() => void s.handleApproveGradeEntry(row.gradeEntryId!)}
                    >
                      Aprobar
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {!s.effectiveGradebookRows.length && (
          <p className="text-muted p-8 text-xs">
            Selecciona una sección con matrículas activas y una materia para registrar notas.
          </p>
        )}
      </SchoolPanel>
    </>
  );
}
