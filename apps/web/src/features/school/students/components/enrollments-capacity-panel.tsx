import type { BaseSyntheticEvent } from "react";
import type { UseFormReturn } from "react-hook-form";
import { ArrowLeftRight, ClipboardCheck, Layers, UserMinus, X } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { FormFieldError } from "@/components/shared/form-field-error";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getSchoolShiftMeta } from "@/features/school/academic/schemas/academic-schemas";
import type { StudentsDrawerKind } from "@/features/school/students/hooks/use-students-workspace";
import {
  calculateSectionOccupancyPercent,
  getEnrollmentStatusMeta,
  type TransferStudentSectionFormValues,
} from "@/features/school/students/schemas/students-schemas";
import type { SectionCapacitySnapshotDto, StudentEnrollmentDto } from "@/lib/api/types";

interface EnrollmentsCapacityPanelProps {
  enrollments: StudentEnrollmentDto[];
  sectionCapacities: SectionCapacitySnapshotDto[];
  selectedSectionFilterId: string;
  onSelectSectionFilter: (sectionId: string) => void;
  canManageEnrollments: boolean;
  openDrawer: StudentsDrawerKind;
  transferringEnrollment: StudentEnrollmentDto | null;
  onOpenTransfer: (enrollment: StudentEnrollmentDto) => void;
  onCloseTransfer: () => void;
  transferForm: UseFormReturn<TransferStudentSectionFormValues>;
  onSubmitTransfer: (event?: BaseSyntheticEvent) => Promise<void>;
  onWithdrawEnrollment: (enrollmentId: string, studentFullName: string) => void;
  actionLoadingId: string | null;
  isSubmitting: boolean;
}

export function EnrollmentsCapacityPanel({
  enrollments,
  sectionCapacities,
  selectedSectionFilterId,
  onSelectSectionFilter,
  canManageEnrollments,
  openDrawer,
  transferringEnrollment,
  onOpenTransfer,
  onCloseTransfer,
  transferForm,
  onSubmitTransfer,
  onWithdrawEnrollment,
  actionLoadingId,
  isSubmitting,
}: EnrollmentsCapacityPanelProps) {
  const transferTargetCandidates = transferringEnrollment
    ? sectionCapacities.filter(
        (section) =>
          !section.isAcademicYearClosed &&
          section.academicYearId === transferringEnrollment.academicYearId &&
          section.sectionId !== transferringEnrollment.sectionId &&
          section.availableSeats > 0,
      )
    : [];

  return (
    <div className="animate-fade-in-up space-y-5">
      {/* Section Capacity Meters Grid */}
      <div className="overflow-hidden rounded-xl border border-slate-200/90 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Monitor de Ocupación y Cupos por Sección
            </h3>
            <p className="text-xs text-slate-500">
              Seleccione una tarjeta de sección para filtrar la nómina de estudiantes matriculados
            </p>
          </div>

          {selectedSectionFilterId !== "all" ? (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => onSelectSectionFilter("all")}
              className="h-7 text-xs"
            >
              Ver todas las secciones
            </Button>
          ) : null}
        </div>

        {sectionCapacities.length === 0 ? (
          <EmptyState
            icon={<Layers className="size-8" />}
            title="Sin secciones configuradas"
            description="Diríjase a «Estructura Académica» para crear grados y secciones con capacidad autorizada."
          />
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {sectionCapacities.map((section) => {
              const isSelected = selectedSectionFilterId === section.sectionId;
              const occupancy = calculateSectionOccupancyPercent(
                section.activeEnrollmentsCount,
                section.capacity,
              );
              const shiftMeta = getSchoolShiftMeta(section.shift);

              return (
                <button
                  key={section.sectionId}
                  type="button"
                  onClick={() => onSelectSectionFilter(isSelected ? "all" : section.sectionId)}
                  className={`flex flex-col justify-between rounded-xl border p-3.5 text-left transition-all ${
                    isSelected
                      ? "border-slate-900 bg-slate-900 text-white shadow-xs"
                      : "border-slate-200/80 bg-white hover:border-slate-300"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`rounded px-2 py-0.5 font-mono text-xs font-bold ${
                          isSelected ? "bg-white text-slate-950" : "bg-slate-900 text-white"
                        }`}
                      >
                        {section.gradeLevelCode}-{section.sectionCode}
                      </span>
                      <span
                        className={`font-mono text-[10px] ${
                          isSelected ? "text-slate-300" : "text-slate-400"
                        }`}
                      >
                        {section.academicYearCode}
                      </span>
                    </div>

                    <div
                      className={`mt-2 text-xs font-semibold ${
                        isSelected ? "text-white" : "text-slate-900"
                      }`}
                    >
                      {section.gradeLevelName}
                    </div>
                    <div
                      className={`text-[11px] ${isSelected ? "text-slate-300" : "text-slate-500"}`}
                    >
                      {shiftMeta.shortLabel}
                    </div>
                  </div>

                  <div className="mt-3 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className={isSelected ? "text-slate-300" : "text-slate-500"}>
                        Ocupación
                      </span>
                      <span className="font-mono font-semibold tabular-nums">
                        {section.activeEnrollmentsCount} / {section.capacity} (
                        {section.availableSeats} libres)
                      </span>
                    </div>
                    <div
                      className={`h-1.5 w-full overflow-hidden rounded-full ${
                        isSelected ? "bg-slate-700" : "bg-slate-100"
                      }`}
                    >
                      <div
                        className={`h-full rounded-full ${
                          occupancy >= 100
                            ? "bg-rose-500"
                            : occupancy >= 80
                              ? "bg-amber-500"
                              : isSelected
                                ? "bg-emerald-400"
                                : "bg-slate-900"
                        }`}
                        style={{ width: `${Math.max(8, occupancy)}%` }}
                      />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Enrollments Table + Transfer Drawer */}
      <div className="overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Nómina Oficial de Matrículas por Año Escolar
            </h3>
            <p className="text-xs text-slate-500">
              Control de traslados entre secciones y retiros con liberación inmediata de cupo
            </p>
          </div>
        </div>

        {/* Collapsible Drawer: Transfer Section */}
        {canManageEnrollments && openDrawer === "transfer" && transferringEnrollment ? (
          <form
            onSubmit={onSubmitTransfer}
            className="animate-slide-down border-b border-slate-200/80 bg-slate-50/70 p-5"
            noValidate
          >
            <div className="mb-3 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-900">
                  Trasladar de sección a {transferringEnrollment.studentFullName} (
                  {transferringEnrollment.studentCode})
                </span>
                <p className="text-[11px] text-slate-500">
                  Sección actual: {transferringEnrollment.gradeLevelCode}-
                  {transferringEnrollment.sectionCode} · Año{" "}
                  {transferringEnrollment.academicYearCode}
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={onCloseTransfer}
                className="h-7 gap-1 text-xs"
              >
                <X className="size-3.5" />
                Cerrar
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="space-y-1 sm:col-span-2">
                <Label htmlFor="transfer-target-section" className="text-xs">
                  Sección de Destino (Mismo Año Escolar con Cupo)
                </Label>
                <select
                  id="transfer-target-section"
                  className="h-8 w-full rounded-md border border-slate-200 bg-white px-2.5 text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
                  {...transferForm.register("targetSectionId")}
                >
                  <option value="">Seleccione sección de destino...</option>
                  {transferTargetCandidates.map((sec) => (
                    <option key={sec.sectionId} value={sec.sectionId}>
                      {sec.gradeLevelCode}-{sec.sectionCode} · {sec.gradeLevelName} (Libres:{" "}
                      {sec.availableSeats}/{sec.capacity})
                    </option>
                  ))}
                </select>
                <FormFieldError message={transferForm.formState.errors.targetSectionId?.message} />
              </div>

              <div className="flex items-end justify-end gap-2">
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSubmitting || transferTargetCandidates.length === 0}
                  className="h-8 w-full text-xs"
                >
                  {isSubmitting ? "Trasladando..." : "Ejecutar Traslado"}
                </Button>
              </div>
            </div>
          </form>
        ) : null}

        {enrollments.length === 0 ? (
          <div className="p-8">
            <EmptyState
              icon={<ClipboardCheck className="size-8" />}
              title="Sin matrículas registradas"
              description="Inscriba estudiantes en las secciones habilitadas desde la vista «Expedientes 360°»."
            />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/60 hover:bg-slate-50/60">
                <TableHead className="text-xs font-semibold text-slate-600">Estudiante</TableHead>
                <TableHead className="text-xs font-semibold text-slate-600">
                  Sección y Grado
                </TableHead>
                <TableHead className="text-xs font-semibold text-slate-600">Año Lectivo</TableHead>
                <TableHead className="text-xs font-semibold text-slate-600">Estado</TableHead>
                <TableHead className="text-right text-xs font-semibold text-slate-600">
                  Acciones
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {enrollments.map((item) => {
                const statusMeta = getEnrollmentStatusMeta(item.status);
                const isRowBusy = actionLoadingId === item.id;

                return (
                  <TableRow key={item.id} className="transition-colors hover:bg-slate-50/70">
                    <TableCell>
                      <div>
                        <div className="text-xs font-semibold text-slate-900">
                          {item.studentFullName}
                        </div>
                        <div className="mt-0.5 flex items-center gap-2 font-mono text-[11px] text-slate-500">
                          <span>{item.studentCode}</span>
                          {item.sigerdExternalId ? (
                            <>
                              <span>·</span>
                              <span>SIGERD: {item.sigerdExternalId}</span>
                            </>
                          ) : null}
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-slate-900 px-2 py-0.5 font-mono text-xs font-semibold text-white">
                          {item.gradeLevelCode}-{item.sectionCode}
                        </span>
                        <span className="text-xs text-slate-700">{item.gradeLevelName}</span>
                      </div>
                    </TableCell>

                    <TableCell className="font-mono text-xs text-slate-600">
                      {item.academicYearCode}
                    </TableCell>

                    <TableCell>
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium ${statusMeta.badgeClass}`}
                      >
                        <span className={`size-1.5 rounded-full ${statusMeta.dotClass}`} />
                        {statusMeta.shortLabel}
                      </span>
                    </TableCell>

                    <TableCell className="text-right">
                      {canManageEnrollments && item.status === "Active" ? (
                        <div className="inline-flex items-center gap-1.5">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={isRowBusy}
                            onClick={() => onOpenTransfer(item)}
                            className="h-7 gap-1 px-2 text-xs"
                          >
                            <ArrowLeftRight className="size-3" />
                            Trasladar
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            disabled={isRowBusy}
                            onClick={() => onWithdrawEnrollment(item.id, item.studentFullName)}
                            className="h-7 gap-1 px-2 text-xs text-rose-700 hover:bg-rose-50 hover:text-rose-800"
                          >
                            <UserMinus className="size-3" />
                            Retirar
                          </Button>
                        </div>
                      ) : (
                        <span className="font-mono text-[11px] text-slate-400">
                          {new Date(item.enrolledAtUtc).toLocaleDateString("es-DO")}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
