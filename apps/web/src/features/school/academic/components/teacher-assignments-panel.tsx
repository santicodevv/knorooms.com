import type { BaseSyntheticEvent } from "react";
import type { UseFormReturn } from "react-hook-form";
import { Clock, Plus, UserCheck, X } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { FormFieldError } from "@/components/shared/form-field-error";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { AcademicDrawerKind } from "@/features/school/academic/hooks/use-academic-workspace";
import {
  getInitials,
  type AssignTeacherFormValues,
} from "@/features/school/academic/schemas/academic-schemas";
import type {
  MemberDto,
  SchoolSectionDto,
  SubjectDto,
  TeacherAssignmentDto,
} from "@/lib/api/types";

interface TeacherAssignmentsPanelProps {
  assignments: TeacherAssignmentDto[];
  sections: SchoolSectionDto[];
  subjects: SubjectDto[];
  members: MemberDto[];
  canManageAcademic: boolean;
  openDrawer: AcademicDrawerKind;
  onToggleDrawer: (drawer: "assignment") => void;
  assignmentForm: UseFormReturn<AssignTeacherFormValues>;
  onSubmitAssignment: (event?: BaseSyntheticEvent) => Promise<void>;
  isSubmitting: boolean;
}

export function TeacherAssignmentsPanel({
  assignments,
  sections,
  subjects,
  members,
  canManageAcademic,
  openDrawer,
  onToggleDrawer,
  assignmentForm,
  onSubmitAssignment,
  isSubmitting,
}: TeacherAssignmentsPanelProps) {
  const activeMembers = members.filter((member) => member.status === "Active");
  const canOpenForm = sections.length > 0 && subjects.length > 0 && activeMembers.length > 0;

  return (
    <div className="animate-fade-in-up overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">
            Matriz de Asignación y Carga Docente
          </h3>
          <p className="text-xs text-slate-500">
            Vinculación oficial entre secciones, asignaturas del currículo y docentes miembros del
            colegio
          </p>
        </div>

        {canManageAcademic ? (
          <Button
            type="button"
            size="sm"
            variant={openDrawer === "assignment" ? "outline" : "default"}
            disabled={!canOpenForm}
            onClick={() => onToggleDrawer("assignment")}
            className="h-8 gap-1.5 px-3 text-xs"
          >
            {openDrawer === "assignment" ? (
              <>
                <X className="size-3.5" />
                Cerrar
              </>
            ) : (
              <>
                <Plus className="size-3.5" />
                Asignar Docente
              </>
            )}
          </Button>
        ) : null}
      </div>

      {/* Collapsible Drawer: Assign Teacher */}
      {canManageAcademic && openDrawer === "assignment" ? (
        <form
          onSubmit={onSubmitAssignment}
          className="animate-slide-down border-b border-slate-200/80 bg-slate-50/70 p-5"
          noValidate
        >
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-800">
              Vincular Docente a Sección y Asignatura
            </span>
            <span className="font-mono text-[11px] text-slate-400">
              Integridad compuesta (tenant_id, section_id, subject_id)
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1">
              <Label htmlFor="assign-section" className="text-xs">
                Sección / Aula
              </Label>
              <select
                id="assign-section"
                className="h-8 w-full rounded-md border border-slate-200 bg-white px-2.5 text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
                {...assignmentForm.register("sectionId")}
              >
                <option value="">Seleccione sección...</option>
                {sections.map((section) => (
                  <option key={section.id} value={section.id}>
                    [{section.academicYearCode}] {section.gradeLevelCode}-{section.code} ·{" "}
                    {section.gradeLevelName}
                  </option>
                ))}
              </select>
              <FormFieldError message={assignmentForm.formState.errors.sectionId?.message} />
            </div>

            <div className="space-y-1">
              <Label htmlFor="assign-subject" className="text-xs">
                Asignatura Curricular
              </Label>
              <select
                id="assign-subject"
                className="h-8 w-full rounded-md border border-slate-200 bg-white px-2.5 text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
                {...assignmentForm.register("subjectId")}
              >
                <option value="">Seleccione asignatura...</option>
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.code} — {subject.name}
                  </option>
                ))}
              </select>
              <FormFieldError message={assignmentForm.formState.errors.subjectId?.message} />
            </div>

            <div className="space-y-1">
              <Label htmlFor="assign-teacher" className="text-xs">
                Docente (Miembro Activo)
              </Label>
              <select
                id="assign-teacher"
                className="h-8 w-full rounded-md border border-slate-200 bg-white px-2.5 text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
                {...assignmentForm.register("teacherMembershipId")}
              >
                <option value="">Seleccione miembro...</option>
                {activeMembers.map((member) => (
                  <option key={member.membershipId} value={member.membershipId}>
                    {member.displayName} ({member.email})
                  </option>
                ))}
              </select>
              <FormFieldError
                message={assignmentForm.formState.errors.teacherMembershipId?.message}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="assign-hours" className="text-xs">
                Horas Pedagógicas / Sem
              </Label>
              <Input
                id="assign-hours"
                type="number"
                min={1}
                max={40}
                className="h-8 bg-white text-xs tabular-nums"
                {...assignmentForm.register("weeklyHours", { valueAsNumber: true })}
              />
              <FormFieldError message={assignmentForm.formState.errors.weeklyHours?.message} />
            </div>
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => onToggleDrawer("assignment")}
              className="h-8 text-xs"
            >
              Cancelar
            </Button>
            <Button type="submit" size="sm" disabled={isSubmitting} className="h-8 text-xs">
              {isSubmitting ? "Asignando..." : "Confirmar Carga Docente"}
            </Button>
          </div>
        </form>
      ) : null}

      {assignments.length === 0 ? (
        <div className="p-8">
          <EmptyState
            icon={<UserCheck className="size-8" />}
            title="Sin carga docente asignada"
            description={
              !canOpenForm
                ? "Para asignar carga docente necesita al menos una sección activa, una asignatura en el catálogo y un miembro institucional activo."
                : "No existen asignaciones docentes registradas para el filtro actual."
            }
          />
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/60 hover:bg-slate-50/60">
              <TableHead className="text-xs font-semibold text-slate-600">
                Sección y Grado
              </TableHead>
              <TableHead className="text-xs font-semibold text-slate-600">Asignatura</TableHead>
              <TableHead className="text-xs font-semibold text-slate-600">
                Docente Responsable
              </TableHead>
              <TableHead className="w-36 text-right text-xs font-semibold text-slate-600">
                Carga Semanal
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {assignments.map((item) => (
              <TableRow key={item.id} className="transition-colors hover:bg-slate-50/70">
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-slate-900 px-2 py-0.5 font-mono text-xs font-semibold text-white">
                      {item.sectionCode}
                    </span>
                    <div>
                      <div className="text-xs font-semibold text-slate-900">
                        {item.gradeLevelName}
                      </div>
                      <div className="font-mono text-[11px] text-slate-400">
                        Año {item.academicYearCode}
                      </div>
                    </div>
                  </div>
                </TableCell>

                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="rounded border border-slate-200 bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-slate-800">
                      {item.subjectCode}
                    </span>
                    <span className="text-xs font-medium text-slate-900">{item.subjectName}</span>
                  </div>
                </TableCell>

                <TableCell>
                  <div className="flex items-center gap-2.5">
                    <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-slate-900 font-mono text-[11px] font-semibold text-white">
                      {getInitials(item.teacherDisplayName)}
                    </div>
                    <div>
                      <div className="text-xs font-medium text-slate-900">
                        {item.teacherDisplayName}
                      </div>
                      <div className="font-mono text-[11px] text-slate-500">
                        {item.teacherEmail}
                      </div>
                    </div>
                  </div>
                </TableCell>

                <TableCell className="text-right">
                  <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 font-mono text-xs font-semibold text-slate-800 tabular-nums">
                    <Clock className="size-3 text-slate-400" />
                    {item.weeklyHours}h / sem
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
