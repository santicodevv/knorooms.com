import {
  SchoolPanel,
  SchoolField,
  SchoolFormActions,
  schoolSelectClass,
} from "../../components/school-ui";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useEvaluationPolicyForm } from "../hooks/use-evaluation-policy-form";
import { useUnsavedChanges } from "@/features/platform/hooks/use-unsaved-changes";
import type { EvaluationsState } from "../hooks/use-evaluations-workspace";
export function EvaluationPolicies({
  state: s,
  creating,
}: {
  state: EvaluationsState;
  creating: boolean;
}) {
  const { form: f, submit } = useEvaluationPolicyForm(s);
  useUnsavedChanges(creating && f.formState.isDirty);
  if (creating)
    return (
      <SchoolPanel
        title="Datos de la política"
        description="La configuración se aplica al año seleccionado."
      >
        <form onSubmit={submit} noValidate className="space-y-6 p-6">
          <div className="grid gap-5 sm:grid-cols-2">
            <SchoolField label="Año escolar *" error={f.formState.errors.academicYearId?.message}>
              <select className={schoolSelectClass} {...f.register("academicYearId")}>
                <option value="">Seleccionar año</option>
                {s.academicYears.map((y) => (
                  <option key={y.id} value={y.id}>
                    {y.code}
                  </option>
                ))}
              </select>
            </SchoolField>
            <SchoolField label="Código *" error={f.formState.errors.policyCode?.message}>
              <Input {...f.register("policyCode")} />
            </SchoolField>
            <SchoolField label="Versión *" error={f.formState.errors.versionNumber?.message}>
              <Input
                type="number"
                min={1}
                {...f.register("versionNumber", { valueAsNumber: true })}
              />
            </SchoolField>
            <SchoolField label="Nombre *" error={f.formState.errors.name?.message}>
              <Input {...f.register("name")} />
            </SchoolField>
            <SchoolField
              label="Nota mínima aprobatoria *"
              error={f.formState.errors.minPassingScore?.message}
            >
              <Input
                type="number"
                min={1}
                max={100}
                {...f.register("minPassingScore", { valueAsNumber: true })}
              />
            </SchoolField>
            <SchoolField label="Observaciones" error={f.formState.errors.notes?.message}>
              <Input {...f.register("notes")} />
            </SchoolField>
          </div>
          <label className="flex items-center gap-3 text-xs text-slate-700">
            <input type="checkbox" {...f.register("isValidatedWithPilotSchool")} />
            Validada con el colegio piloto
          </label>
          <SchoolFormActions
            back="/settings/policies"
            busy={s.isSubmitting}
            label="Crear política"
          />
        </form>
      </SchoolPanel>
    );
  return (
    <SchoolPanel
      title="Políticas de evaluación"
      description="Versiones registradas para el año seleccionado."
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Política</TableHead>
            <TableHead>Versión</TableHead>
            <TableHead>Mínima aprobatoria</TableHead>
            <TableHead>Validación</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {s.gradingOverview.policies.map((p) => (
            <TableRow key={p.id}>
              <TableCell>
                <strong>{p.name}</strong>
                <p className="text-muted mt-1 text-[11px]">{p.policyCode}</p>
              </TableCell>
              <TableCell>{p.versionNumber}</TableCell>
              <TableCell>{p.minPassingScore}</TableCell>
              <TableCell>
                <Badge variant={p.isValidatedWithPilotSchool ? "success" : "secondary"}>
                  {p.isValidatedWithPilotSchool ? "Validada con piloto" : "Pendiente de validación"}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {!s.gradingOverview.policies.length && (
        <p className="text-muted p-8 text-xs">
          No hay políticas registradas para este año escolar.
        </p>
      )}
    </SchoolPanel>
  );
}
