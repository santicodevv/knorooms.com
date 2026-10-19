import type { BaseSyntheticEvent } from "react";
import type { UseFormReturn } from "react-hook-form";
import { BookOpen, Plus, Search, X } from "lucide-react";
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
import type { CreateSubjectFormValues } from "@/features/school/academic/schemas/academic-schemas";
import type { SubjectDto } from "@/lib/api/types";

interface CurriculumSubjectsPanelProps {
  subjects: SubjectDto[];
  totalSubjectsCount: number;
  searchQuery: string;
  onChangeSearchQuery: (value: string) => void;
  canManageAcademic: boolean;
  openDrawer: AcademicDrawerKind;
  onToggleDrawer: (drawer: "subject") => void;
  subjectForm: UseFormReturn<CreateSubjectFormValues>;
  onSubmitSubject: (event?: BaseSyntheticEvent) => Promise<void>;
  isSubmitting: boolean;
}

export function CurriculumSubjectsPanel({
  subjects,
  totalSubjectsCount,
  searchQuery,
  onChangeSearchQuery,
  canManageAcademic,
  openDrawer,
  onToggleDrawer,
  subjectForm,
  onSubmitSubject,
  isSubmitting,
}: CurriculumSubjectsPanelProps) {
  return (
    <div className="animate-fade-in-up overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">
            Catálogo Curricular de Asignaturas
          </h3>
          <p className="text-xs text-slate-500">
            Áreas curriculares y asignaturas habilitadas para vinculación con secciones y docentes
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => onChangeSearchQuery(event.target.value)}
              placeholder="Filtrar código o nombre..."
              className="h-8 w-56 rounded-lg border border-slate-200 bg-slate-50/70 pr-3 pl-8 text-xs text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:bg-white focus:outline-none"
            />
          </div>

          {canManageAcademic ? (
            <Button
              type="button"
              size="sm"
              variant={openDrawer === "subject" ? "outline" : "default"}
              onClick={() => onToggleDrawer("subject")}
              className="h-8 gap-1.5 px-3 text-xs"
            >
              {openDrawer === "subject" ? (
                <>
                  <X className="size-3.5" />
                  Cerrar
                </>
              ) : (
                <>
                  <Plus className="size-3.5" />
                  Nueva Asignatura
                </>
              )}
            </Button>
          ) : null}
        </div>
      </div>

      {/* Collapsible Drawer: Create Subject */}
      {canManageAcademic && openDrawer === "subject" ? (
        <form
          onSubmit={onSubmitSubject}
          className="animate-slide-down border-b border-slate-200/80 bg-slate-50/70 p-5"
          noValidate
        >
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-800">
              Incorporar Asignatura al Diseño Curricular
            </span>
            <span className="font-mono text-[11px] text-slate-400">
              Unicidad por (tenant_id, code)
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-1">
              <Label htmlFor="subject-code" className="text-xs">
                Código Curricular
              </Label>
              <Input
                id="subject-code"
                placeholder="Ej. MAT-S4, LEN-P3"
                className="h-8 bg-white font-mono text-xs uppercase"
                {...subjectForm.register("code")}
              />
              <FormFieldError message={subjectForm.formState.errors.code?.message} />
            </div>

            <div className="space-y-1 sm:col-span-2">
              <Label htmlFor="subject-name" className="text-xs">
                Nombre Oficial de la Asignatura
              </Label>
              <Input
                id="subject-name"
                placeholder="Ej. Matemáticas y Geometría Analítica"
                className="h-8 bg-white text-xs"
                {...subjectForm.register("name")}
              />
              <FormFieldError message={subjectForm.formState.errors.name?.message} />
            </div>
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => onToggleDrawer("subject")}
              className="h-8 text-xs"
            >
              Cancelar
            </Button>
            <Button type="submit" size="sm" disabled={isSubmitting} className="h-8 text-xs">
              {isSubmitting ? "Guardando..." : "Guardar Asignatura"}
            </Button>
          </div>
        </form>
      ) : null}

      {subjects.length === 0 ? (
        <div className="p-8">
          <EmptyState
            icon={<BookOpen className="size-8" />}
            title={
              totalSubjectsCount === 0
                ? "Catálogo curricular vacío"
                : "Sin coincidencias en el catálogo"
            }
            description={
              totalSubjectsCount === 0
                ? "Registre la primera asignatura para habilitar la asignación docente en las secciones."
                : "Ninguna asignatura coincide con el término buscado."
            }
          />
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/60 hover:bg-slate-50/60">
              <TableHead className="w-40 text-xs font-semibold text-slate-600">Código</TableHead>
              <TableHead className="text-xs font-semibold text-slate-600">
                Asignatura / Área Curricular
              </TableHead>
              <TableHead className="w-44 text-right text-xs font-semibold text-slate-600">
                Secciones Asignadas
              </TableHead>
              <TableHead className="w-40 text-right text-xs font-semibold text-slate-600">
                Fecha de Alta
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {subjects.map((subject) => (
              <TableRow key={subject.id} className="group transition-colors hover:bg-slate-50/70">
                <TableCell>
                  <span className="inline-flex items-center rounded-md border border-slate-200 bg-slate-100/80 px-2 py-0.5 font-mono text-xs font-semibold text-slate-900">
                    {subject.code}
                  </span>
                </TableCell>
                <TableCell className="text-xs font-medium text-slate-900">{subject.name}</TableCell>
                <TableCell className="text-right">
                  <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 font-mono text-xs font-medium text-slate-700 tabular-nums">
                    {subject.assignedSectionsCount} aulas
                  </span>
                </TableCell>
                <TableCell className="text-right font-mono text-xs text-slate-500 tabular-nums">
                  {new Date(subject.createdAtUtc).toLocaleDateString("es-DO")}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
