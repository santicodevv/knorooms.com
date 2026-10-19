import type { BaseSyntheticEvent } from "react";
import type { UseFormReturn } from "react-hook-form";
import { CalendarRange, Lock, LockOpen, Plus, X } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { FormFieldError } from "@/components/shared/form-field-error";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AcademicDrawerKind } from "@/features/school/academic/hooks/use-academic-workspace";
import {
  calculateAcademicYearProgress,
  type CreateAcademicYearFormValues,
} from "@/features/school/academic/schemas/academic-schemas";
import type { AcademicYearDto } from "@/lib/api/types";

interface AcademicYearsPanelProps {
  academicYears: AcademicYearDto[];
  canManageAcademic: boolean;
  openDrawer: AcademicDrawerKind;
  onToggleDrawer: (drawer: "year") => void;
  yearForm: UseFormReturn<CreateAcademicYearFormValues>;
  onSubmitYear: (event?: BaseSyntheticEvent) => Promise<void>;
  onToggleYearStatus: (yearId: string, yearCode: string, currentlyClosed: boolean) => void;
  actionLoadingId: string | null;
  isSubmitting: boolean;
}

export function AcademicYearsPanel({
  academicYears,
  canManageAcademic,
  openDrawer,
  onToggleDrawer,
  yearForm,
  onSubmitYear,
  onToggleYearStatus,
  actionLoadingId,
  isSubmitting,
}: AcademicYearsPanelProps) {
  return (
    <div className="animate-fade-in-up overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">
            Ciclos y Años Escolares Oficiales
          </h3>
          <p className="text-xs text-slate-500">
            Control de apertura y cierre de períodos lectivos para matrículas, secciones y boletines
          </p>
        </div>

        {canManageAcademic ? (
          <Button
            type="button"
            size="sm"
            variant={openDrawer === "year" ? "outline" : "default"}
            onClick={() => onToggleDrawer("year")}
            className="h-8 gap-1.5 px-3 text-xs"
          >
            {openDrawer === "year" ? (
              <>
                <X className="size-3.5" />
                Cerrar Formulario
              </>
            ) : (
              <>
                <Plus className="size-3.5" />
                Inaugurar Año Escolar
              </>
            )}
          </Button>
        ) : null}
      </div>

      {/* Collapsible Creation Drawer */}
      {canManageAcademic && openDrawer === "year" ? (
        <form
          onSubmit={onSubmitYear}
          className="animate-slide-down border-b border-slate-200/80 bg-slate-50/70 p-5"
          noValidate
        >
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-800">
              Apertura de Nuevo Año Escolar
            </span>
            <span className="font-mono text-[11px] text-slate-400">Calendario Escolar MINERD</span>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1">
              <Label htmlFor="year-code" className="text-xs">
                Código del Período
              </Label>
              <Input
                id="year-code"
                placeholder="2026-2027"
                className="h-8 bg-white font-mono text-xs uppercase"
                {...yearForm.register("code")}
              />
              <FormFieldError message={yearForm.formState.errors.code?.message} />
            </div>

            <div className="space-y-1">
              <Label htmlFor="year-name" className="text-xs">
                Nombre Oficial
              </Label>
              <Input
                id="year-name"
                placeholder="Año Escolar 2026-2027"
                className="h-8 bg-white text-xs"
                {...yearForm.register("name")}
              />
              <FormFieldError message={yearForm.formState.errors.name?.message} />
            </div>

            <div className="space-y-1">
              <Label htmlFor="year-startDate" className="text-xs">
                Fecha de Inicio
              </Label>
              <Input
                id="year-startDate"
                type="date"
                className="h-8 bg-white font-mono text-xs tabular-nums"
                {...yearForm.register("startDate")}
              />
              <FormFieldError message={yearForm.formState.errors.startDate?.message} />
            </div>

            <div className="space-y-1">
              <Label htmlFor="year-endDate" className="text-xs">
                Fecha de Cierre
              </Label>
              <Input
                id="year-endDate"
                type="date"
                className="h-8 bg-white font-mono text-xs tabular-nums"
                {...yearForm.register("endDate")}
              />
              <FormFieldError message={yearForm.formState.errors.endDate?.message} />
            </div>
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => onToggleDrawer("year")}
              className="h-8 text-xs"
            >
              Cancelar
            </Button>
            <Button type="submit" size="sm" disabled={isSubmitting} className="h-8 text-xs">
              {isSubmitting ? "Registrando..." : "Registrar Año Escolar"}
            </Button>
          </div>
        </form>
      ) : null}

      {academicYears.length === 0 ? (
        <div className="p-8">
          <EmptyState
            icon={<CalendarRange className="size-8" />}
            title="Sin años escolares registrados"
            description="Inaugure el primer período lectivo para habilitar secciones, matrículas y asignaciones docentes."
          />
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {academicYears.map((year) => {
            const progress = calculateAcademicYearProgress(year.startDate, year.endDate);
            const isToggling = actionLoadingId === year.id;

            return (
              <div
                key={year.id}
                className="flex flex-col justify-between gap-4 px-5 py-4 transition-colors hover:bg-slate-50/50 md:flex-row md:items-center"
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="rounded-md bg-slate-900 px-2 py-0.5 font-mono text-xs font-semibold text-white">
                      {year.code}
                    </span>
                    <span className="text-sm font-semibold text-slate-900">{year.name}</span>
                    {year.isClosed ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                        <Lock className="size-3" />
                        Cerrado
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-800">
                        <span className="size-1.5 rounded-full bg-emerald-500" />
                        Abierto
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    <span className="font-mono tabular-nums">
                      Vigencia: {year.startDate} → {year.endDate}
                    </span>
                    <span>·</span>
                    <span className="font-medium text-slate-700 tabular-nums">
                      {year.sectionsCount} secciones vinculadas
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                  <div className="w-36 space-y-1">
                    <div className="flex justify-between text-[11px] text-slate-500">
                      <span>Avance calendario</span>
                      <span className="font-mono font-semibold text-slate-700 tabular-nums">
                        {progress}%
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full ${
                          year.isClosed ? "bg-slate-400" : "bg-slate-900"
                        }`}
                        style={{ width: `${Math.max(6, progress)}%` }}
                      />
                    </div>
                  </div>

                  {canManageAcademic ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={isToggling}
                      onClick={() => onToggleYearStatus(year.id, year.code, year.isClosed)}
                      className="h-8 gap-1.5 text-xs"
                    >
                      {year.isClosed ? (
                        <>
                          <LockOpen className="size-3.5 text-emerald-600" />
                          {isToggling ? "Reabriendo..." : "Reabrir Año"}
                        </>
                      ) : (
                        <>
                          <Lock className="size-3.5 text-slate-600" />
                          {isToggling ? "Cerrando..." : "Cerrar Año"}
                        </>
                      )}
                    </Button>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
