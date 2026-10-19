import type { BaseSyntheticEvent } from "react";
import type { UseFormReturn } from "react-hook-form";
import { BookOpen, ChevronRight, Clock, GraduationCap, Layers, Plus, Users, X } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { FormFieldError } from "@/components/shared/form-field-error";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AcademicDrawerKind } from "@/features/school/academic/hooks/use-academic-workspace";
import {
  EDUCATIONAL_STAGE_OPTIONS,
  getEducationalStageMeta,
  getSchoolShiftMeta,
  SCHOOL_SHIFT_OPTIONS,
  type CreateGradeLevelFormValues,
  type CreateSchoolSectionFormValues,
} from "@/features/school/academic/schemas/academic-schemas";
import type { AcademicYearDto, GradeLevelDto, SchoolSectionDto } from "@/lib/api/types";

interface GradesSectionsSplitViewProps {
  gradeLevels: GradeLevelDto[];
  academicYears: AcademicYearDto[];
  filteredSections: SchoolSectionDto[];
  selectedGradeLevelId: string;
  onSelectGradeLevel: (gradeId: string) => void;
  canManageAcademic: boolean;
  openDrawer: AcademicDrawerKind;
  onToggleDrawer: (drawer: "grade" | "section") => void;
  gradeForm: UseFormReturn<CreateGradeLevelFormValues>;
  onSubmitGradeLevel: (event?: BaseSyntheticEvent) => Promise<void>;
  sectionForm: UseFormReturn<CreateSchoolSectionFormValues>;
  onSubmitSection: (event?: BaseSyntheticEvent) => Promise<void>;
  isSubmitting: boolean;
}

export function GradesSectionsSplitView({
  gradeLevels,
  academicYears,
  filteredSections,
  selectedGradeLevelId,
  onSelectGradeLevel,
  canManageAcademic,
  openDrawer,
  onToggleDrawer,
  gradeForm,
  onSubmitGradeLevel,
  sectionForm,
  onSubmitSection,
  isSubmitting,
}: GradesSectionsSplitViewProps) {
  const selectedGrade =
    selectedGradeLevelId === "all"
      ? null
      : (gradeLevels.find((grade) => grade.id === selectedGradeLevelId) ?? null);

  const openYears = academicYears.filter((year) => !year.isClosed);

  return (
    <div className="animate-fade-in-up grid grid-cols-1 gap-5 lg:grid-cols-12">
      {/* Left Master Pane: Official MINERD Grade Levels */}
      <div className="flex flex-col overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] lg:col-span-5">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3.5">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Grados Oficiales</h3>
            <p className="text-xs text-slate-500">Estructura secuencial MINERD (1.º a 12.º)</p>
          </div>
          {canManageAcademic ? (
            <Button
              type="button"
              size="sm"
              variant={openDrawer === "grade" ? "outline" : "default"}
              onClick={() => onToggleDrawer("grade")}
              className="h-7 gap-1 px-2.5 text-xs"
            >
              {openDrawer === "grade" ? (
                <>
                  <X className="size-3.5" />
                  Cerrar
                </>
              ) : (
                <>
                  <Plus className="size-3.5" />
                  Nuevo Grado
                </>
              )}
            </Button>
          ) : null}
        </div>

        {/* Collapsible Drawer: Create Grade Level */}
        {canManageAcademic && openDrawer === "grade" ? (
          <form
            onSubmit={onSubmitGradeLevel}
            className="animate-slide-down border-b border-slate-200/80 bg-slate-50/70 p-4"
            noValidate
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-800">
                Registrar Grado Académico
              </span>
              <span className="font-mono text-[11px] text-slate-400">MINERD</span>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="grade-stage" className="text-xs">
                  Nivel Educativo
                </Label>
                <select
                  id="grade-stage"
                  className="h-8 w-full rounded-md border border-slate-200 bg-white px-2.5 text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
                  {...gradeForm.register("stage")}
                >
                  {EDUCATIONAL_STAGE_OPTIONS.map((stage) => (
                    <option key={stage.value} value={stage.value}>
                      {stage.label}
                    </option>
                  ))}
                </select>
                <FormFieldError message={gradeForm.formState.errors.stage?.message} />
              </div>

              <div className="space-y-1">
                <Label htmlFor="grade-number" className="text-xs">
                  Orden Oficial (1–12)
                </Label>
                <Input
                  id="grade-number"
                  type="number"
                  min={1}
                  max={12}
                  className="h-8 bg-white text-xs tabular-nums"
                  {...gradeForm.register("officialGradeNumber", { valueAsNumber: true })}
                />
                <FormFieldError message={gradeForm.formState.errors.officialGradeNumber?.message} />
              </div>

              <div className="space-y-1">
                <Label htmlFor="grade-code" className="text-xs">
                  Código Corto
                </Label>
                <Input
                  id="grade-code"
                  placeholder="Ej. P1, S4"
                  className="h-8 bg-white font-mono text-xs uppercase"
                  {...gradeForm.register("code")}
                />
                <FormFieldError message={gradeForm.formState.errors.code?.message} />
              </div>

              <div className="space-y-1">
                <Label htmlFor="grade-displayName" className="text-xs">
                  Nombre Oficial
                </Label>
                <Input
                  id="grade-displayName"
                  placeholder="Ej. 4.º de Secundaria"
                  className="h-8 bg-white text-xs"
                  {...gradeForm.register("displayName")}
                />
                <FormFieldError message={gradeForm.formState.errors.displayName?.message} />
              </div>
            </div>

            <div className="mt-3 flex justify-end gap-2">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => onToggleDrawer("grade")}
                className="h-7 text-xs"
              >
                Cancelar
              </Button>
              <Button type="submit" size="sm" disabled={isSubmitting} className="h-7 text-xs">
                {isSubmitting ? "Guardando..." : "Guardar Grado"}
              </Button>
            </div>
          </form>
        ) : null}

        {/* Master List of Grade Levels */}
        <div className="divide-y divide-slate-100">
          <button
            type="button"
            onClick={() => onSelectGradeLevel("all")}
            className={`flex w-full items-center justify-between px-4 py-3 text-left transition-colors ${
              selectedGradeLevelId === "all"
                ? "border-l-2 border-l-slate-900 bg-slate-50/90 font-medium text-slate-950"
                : "text-slate-600 hover:bg-slate-50/50 hover:text-slate-900"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className="flex size-7 items-center justify-center rounded-md border border-slate-200 bg-white text-xs font-semibold text-slate-700">
                <Layers className="size-3.5" />
              </div>
              <div>
                <div className="text-xs font-semibold">Todos los grados registrados</div>
                <div className="text-[11px] text-slate-400">
                  Vista consolidada de secciones por año escolar
                </div>
              </div>
            </div>
            <ChevronRight
              className={`size-4 transition-transform ${
                selectedGradeLevelId === "all" ? "translate-x-0.5 text-slate-900" : "text-slate-300"
              }`}
            />
          </button>

          {gradeLevels.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={<GraduationCap className="size-8" />}
                title="Sin grados oficiales"
                description="Aún no se han definido grados académicos en esta institución."
              />
            </div>
          ) : (
            gradeLevels.map((grade) => {
              const isSelected = selectedGradeLevelId === grade.id;
              const stageMeta = getEducationalStageMeta(grade.stage);

              return (
                <button
                  key={grade.id}
                  type="button"
                  onClick={() => onSelectGradeLevel(grade.id)}
                  className={`group flex w-full items-center justify-between px-4 py-3 text-left transition-all ${
                    isSelected
                      ? "border-l-2 border-l-slate-900 bg-slate-50/95 text-slate-950"
                      : "text-slate-700 hover:bg-slate-50/60"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex size-8 shrink-0 items-center justify-center rounded-lg border font-mono text-xs font-semibold tabular-nums transition-colors ${
                        isSelected
                          ? "border-slate-900 bg-slate-900 text-white"
                          : "border-slate-200 bg-slate-50 text-slate-700 group-hover:border-slate-300"
                      }`}
                    >
                      {grade.officialGradeNumber}º
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-900">
                          {grade.displayName}
                        </span>
                        <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] font-medium text-slate-600">
                          {grade.code}
                        </span>
                      </div>
                      <div className="mt-0.5 flex items-center gap-2 text-[11px] text-slate-500">
                        <span>{stageMeta.shortLabel}</span>
                        <span>·</span>
                        <span className="tabular-nums">{grade.sectionsCount} secciones</span>
                      </div>
                    </div>
                  </div>

                  <ChevronRight
                    className={`size-4 transition-transform ${
                      isSelected
                        ? "translate-x-0.5 text-slate-900"
                        : "text-slate-300 group-hover:translate-x-0.5 group-hover:text-slate-500"
                    }`}
                  />
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Right Detail Pane: Sections & Classroom Capacity */}
      <div className="flex flex-col overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] lg:col-span-7">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-3.5">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-slate-900">
                {selectedGrade
                  ? `Secciones de ${selectedGrade.displayName}`
                  : "Secciones y Capacidad de Aula"}
              </h3>
              {selectedGrade ? (
                <Badge variant="outline" className="font-mono text-[11px]">
                  {selectedGrade.code}
                </Badge>
              ) : null}
            </div>
            <p className="text-xs text-slate-500">
              Distribución de aulas por tanda horaria, cupo máximo y carga curricular
            </p>
          </div>

          {canManageAcademic ? (
            <Button
              type="button"
              size="sm"
              variant={openDrawer === "section" ? "outline" : "default"}
              disabled={openYears.length === 0 || gradeLevels.length === 0}
              onClick={() => onToggleDrawer("section")}
              className="h-7 gap-1 px-2.5 text-xs"
            >
              {openDrawer === "section" ? (
                <>
                  <X className="size-3.5" />
                  Cerrar
                </>
              ) : (
                <>
                  <Plus className="size-3.5" />
                  Habilitar Sección
                </>
              )}
            </Button>
          ) : null}
        </div>

        {/* Collapsible Drawer: Create School Section */}
        {canManageAcademic && openDrawer === "section" ? (
          <form
            onSubmit={onSubmitSection}
            className="animate-slide-down border-b border-slate-200/80 bg-slate-50/70 p-4"
            noValidate
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-800">
                Apertura de Nueva Sección / Aula
              </span>
              <span className="text-[11px] text-slate-500">
                Clave compuesta (tenant_id, academic_year_id, grade_level_id, code)
              </span>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-1">
                <Label htmlFor="section-year" className="text-xs">
                  Año Escolar Abierto
                </Label>
                <select
                  id="section-year"
                  className="h-8 w-full rounded-md border border-slate-200 bg-white px-2.5 text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
                  {...sectionForm.register("academicYearId")}
                >
                  {openYears.map((year) => (
                    <option key={year.id} value={year.id}>
                      {year.code} — {year.name}
                    </option>
                  ))}
                </select>
                <FormFieldError message={sectionForm.formState.errors.academicYearId?.message} />
              </div>

              <div className="space-y-1">
                <Label htmlFor="section-grade" className="text-xs">
                  Grado Oficial
                </Label>
                <select
                  id="section-grade"
                  className="h-8 w-full rounded-md border border-slate-200 bg-white px-2.5 text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
                  {...sectionForm.register("gradeLevelId")}
                >
                  {gradeLevels.map((grade) => (
                    <option key={grade.id} value={grade.id}>
                      {grade.code} · {grade.displayName}
                    </option>
                  ))}
                </select>
                <FormFieldError message={sectionForm.formState.errors.gradeLevelId?.message} />
              </div>

              <div className="space-y-1">
                <Label htmlFor="section-code" className="text-xs">
                  Sección (Letra / Código)
                </Label>
                <Input
                  id="section-code"
                  placeholder="Ej. A, B, 01"
                  className="h-8 bg-white font-mono text-xs uppercase"
                  {...sectionForm.register("code")}
                />
                <FormFieldError message={sectionForm.formState.errors.code?.message} />
              </div>

              <div className="space-y-1 sm:col-span-2">
                <Label htmlFor="section-shift" className="text-xs">
                  Tanda Horaria
                </Label>
                <select
                  id="section-shift"
                  className="h-8 w-full rounded-md border border-slate-200 bg-white px-2.5 text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
                  {...sectionForm.register("shift")}
                >
                  {SCHOOL_SHIFT_OPTIONS.map((shift) => (
                    <option key={shift.value} value={shift.value}>
                      {shift.label} ({shift.scheduleHint})
                    </option>
                  ))}
                </select>
                <FormFieldError message={sectionForm.formState.errors.shift?.message} />
              </div>

              <div className="space-y-1">
                <Label htmlFor="section-capacity" className="text-xs">
                  Capacidad (Cupos)
                </Label>
                <Input
                  id="section-capacity"
                  type="number"
                  min={1}
                  max={120}
                  className="h-8 bg-white text-xs tabular-nums"
                  {...sectionForm.register("capacity", { valueAsNumber: true })}
                />
                <FormFieldError message={sectionForm.formState.errors.capacity?.message} />
              </div>
            </div>

            <div className="mt-3 flex justify-end gap-2">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => onToggleDrawer("section")}
                className="h-7 text-xs"
              >
                Cancelar
              </Button>
              <Button type="submit" size="sm" disabled={isSubmitting} className="h-7 text-xs">
                {isSubmitting ? "Creando..." : "Crear Sección"}
              </Button>
            </div>
          </form>
        ) : null}

        {/* Sections Grid / List */}
        {filteredSections.length === 0 ? (
          <div className="flex flex-1 flex-col justify-center p-8">
            <EmptyState
              icon={<Layers className="size-8" />}
              title="Sin secciones habilitadas"
              description={
                openYears.length === 0
                  ? "Primero inaugure un Año Escolar activo para habilitar secciones y aulas."
                  : gradeLevels.length === 0
                    ? "Registre al menos un Grado Oficial en el panel izquierdo para crear secciones."
                    : "No hay secciones registradas para el filtro seleccionado."
              }
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2">
            {filteredSections.map((section) => {
              const shiftMeta = getSchoolShiftMeta(section.shift);
              const capacityRatio = Math.min(100, Math.round((section.capacity / 45) * 100));

              return (
                <div
                  key={section.id}
                  className="animate-scale-in group flex flex-col justify-between rounded-xl border border-slate-200/80 bg-white p-4 transition-all hover:border-slate-300 hover:shadow-xs"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center rounded-md bg-slate-900 px-2 py-0.5 font-mono text-xs font-semibold text-white">
                          {section.gradeLevelCode}-{section.code}
                        </span>
                        <span className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-mono text-[10px] text-slate-600">
                          {section.academicYearCode}
                        </span>
                      </div>

                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                        <Clock className="size-3 text-slate-500" />
                        {shiftMeta.shortLabel}
                      </span>
                    </div>

                    <div className="mt-2.5 text-sm font-semibold text-slate-900">
                      {section.gradeLevelName} · Sección {section.code}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Horario de referencia: {shiftMeta.scheduleHint}
                    </div>
                  </div>

                  <div className="mt-4 space-y-2 border-t border-slate-100 pt-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="inline-flex items-center gap-1 text-slate-600">
                        <Users className="size-3.5 text-slate-400" />
                        Capacidad autorizada
                      </span>
                      <span className="font-mono font-semibold text-slate-900 tabular-nums">
                        {section.capacity} cupos
                      </span>
                    </div>

                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="animate-progress-grow h-full rounded-full bg-slate-800"
                        style={{ width: `${Math.max(15, capacityRatio)}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500">
                      <span className="inline-flex items-center gap-1">
                        <BookOpen className="size-3 text-slate-400" />
                        Carga curricular vinculada
                      </span>
                      <span className="font-mono font-medium text-slate-700 tabular-nums">
                        {section.assignedSubjectsCount} asignaturas
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
