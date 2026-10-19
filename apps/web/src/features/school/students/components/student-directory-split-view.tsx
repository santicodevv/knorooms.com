import type { BaseSyntheticEvent } from "react";
import type { UseFormReturn } from "react-hook-form";
import {
  BadgeCheck,
  Calendar,
  ChevronRight,
  ClipboardCheck,
  ContactRound,
  CreditCard,
  Fingerprint,
  GraduationCap,
  HeartHandshake,
  Mail,
  Phone,
  Plus,
  Search,
  ShieldCheck,
  UserCheck,
  UserMinus,
  UserPlus,
  X,
} from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { FormFieldError } from "@/components/shared/form-field-error";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getInitials } from "@/features/school/academic/schemas/academic-schemas";
import type {
  StudentsDrawerKind,
  StudentStatusFilter,
} from "@/features/school/students/hooks/use-students-workspace";
import {
  calculateStudentAge,
  getEnrollmentStatusMeta,
  GUARDIAN_RELATIONSHIP_SUGGESTIONS,
  type CreateStudentFormValues,
  type EnrollStudentFormValues,
  type LinkStudentGuardianFormValues,
} from "@/features/school/students/schemas/students-schemas";
import type { GuardianDto, SectionCapacitySnapshotDto, StudentDto } from "@/lib/api/types";

interface StudentDirectorySplitViewProps {
  students: StudentDto[];
  totalStudentsCount: number;
  selectedStudent: StudentDto | null;
  onSelectStudent: (studentId: string) => void;
  searchQuery: string;
  onChangeSearchQuery: (query: string) => void;
  statusFilter: StudentStatusFilter;
  onChangeStatusFilter: (filter: StudentStatusFilter) => void;
  guardians: GuardianDto[];
  availableSections: SectionCapacitySnapshotDto[];
  canManageStudents: boolean;
  canManageEnrollments: boolean;
  openDrawer: StudentsDrawerKind;
  onToggleDrawer: (drawer: "student" | "link-guardian" | "enroll") => void;
  onOpenQuickEnroll: (studentId: string) => void;
  onToggleStudentActive: (studentId: string, studentCode: string, currentlyActive: boolean) => void;
  studentForm: UseFormReturn<CreateStudentFormValues>;
  onSubmitStudent: (event?: BaseSyntheticEvent) => Promise<void>;
  linkGuardianForm: UseFormReturn<LinkStudentGuardianFormValues>;
  onSubmitLinkGuardian: (event?: BaseSyntheticEvent) => Promise<void>;
  enrollForm: UseFormReturn<EnrollStudentFormValues>;
  onSubmitEnroll: (event?: BaseSyntheticEvent) => Promise<void>;
  actionLoadingId: string | null;
  isSubmitting: boolean;
}

export function StudentDirectorySplitView({
  students,
  totalStudentsCount,
  selectedStudent,
  onSelectStudent,
  searchQuery,
  onChangeSearchQuery,
  statusFilter,
  onChangeStatusFilter,
  guardians,
  availableSections,
  canManageStudents,
  canManageEnrollments,
  openDrawer,
  onToggleDrawer,
  onOpenQuickEnroll,
  onToggleStudentActive,
  studentForm,
  onSubmitStudent,
  linkGuardianForm,
  onSubmitLinkGuardian,
  enrollForm,
  onSubmitEnroll,
  actionLoadingId,
  isSubmitting,
}: StudentDirectorySplitViewProps) {
  return (
    <div className="animate-fade-in-up grid grid-cols-1 gap-5 lg:grid-cols-12">
      {/* Left Master Pane: Permanent Student Roster */}
      <div className="flex flex-col overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] lg:col-span-5">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3.5">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Padrón de Expedientes</h3>
            <p className="text-xs text-slate-500">
              Registro histórico único por estudiante ({totalStudentsCount})
            </p>
          </div>

          {canManageStudents ? (
            <Button
              type="button"
              size="sm"
              variant={openDrawer === "student" ? "outline" : "default"}
              onClick={() => onToggleDrawer("student")}
              className="h-7 gap-1 px-2.5 text-xs"
            >
              {openDrawer === "student" ? (
                <>
                  <X className="size-3.5" />
                  Cerrar
                </>
              ) : (
                <>
                  <Plus className="size-3.5" />
                  Nuevo Expediente
                </>
              )}
            </Button>
          ) : null}
        </div>

        {/* Collapsible Drawer: Create Permanent Student Record */}
        {canManageStudents && openDrawer === "student" ? (
          <form
            onSubmit={onSubmitStudent}
            className="animate-slide-down border-b border-slate-200/80 bg-slate-50/70 p-4"
            noValidate
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-800">
                Apertura de Expediente Estudiantil Permanente
              </span>
              <span className="font-mono text-[11px] text-slate-400">SIGERD / MINERD</span>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="stu-code" className="text-xs">
                  Código / Matrícula Institucional
                </Label>
                <Input
                  id="stu-code"
                  placeholder="Ej. EST-2026-001"
                  className="h-8 bg-white font-mono text-xs uppercase"
                  {...studentForm.register("studentCode")}
                />
                <FormFieldError message={studentForm.formState.errors.studentCode?.message} />
              </div>

              <div className="space-y-1">
                <Label htmlFor="stu-sigerd" className="text-xs">
                  ID Externo SIGERD (Opcional)
                </Label>
                <Input
                  id="stu-sigerd"
                  placeholder="Ej. SIGERD-88412"
                  className="h-8 bg-white font-mono text-xs"
                  {...studentForm.register("sigerdExternalId")}
                />
                <FormFieldError message={studentForm.formState.errors.sigerdExternalId?.message} />
              </div>

              <div className="space-y-1">
                <Label htmlFor="stu-firstName" className="text-xs">
                  Nombres
                </Label>
                <Input
                  id="stu-firstName"
                  placeholder="Ej. Camila"
                  className="h-8 bg-white text-xs"
                  {...studentForm.register("firstName")}
                />
                <FormFieldError message={studentForm.formState.errors.firstName?.message} />
              </div>

              <div className="space-y-1">
                <Label htmlFor="stu-lastName" className="text-xs">
                  Apellidos
                </Label>
                <Input
                  id="stu-lastName"
                  placeholder="Ej. Rodríguez Ureña"
                  className="h-8 bg-white text-xs"
                  {...studentForm.register("lastName")}
                />
                <FormFieldError message={studentForm.formState.errors.lastName?.message} />
              </div>

              <div className="space-y-1 sm:col-span-2">
                <Label htmlFor="stu-birthDate" className="text-xs">
                  Fecha de Nacimiento
                </Label>
                <Input
                  id="stu-birthDate"
                  type="date"
                  className="h-8 bg-white font-mono text-xs tabular-nums"
                  {...studentForm.register("birthDate")}
                />
                <FormFieldError message={studentForm.formState.errors.birthDate?.message} />
              </div>
            </div>

            <div className="mt-3 flex justify-end gap-2">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => onToggleDrawer("student")}
                className="h-7 text-xs"
              >
                Cancelar
              </Button>
              <Button type="submit" size="sm" disabled={isSubmitting} className="h-7 text-xs">
                {isSubmitting ? "Registrando..." : "Crear Expediente"}
              </Button>
            </div>
          </form>
        ) : null}

        {/* Search & Quick Filter Bar */}
        <div className="space-y-2 border-b border-slate-100 bg-slate-50/40 px-4 py-2.5">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => onChangeSearchQuery(event.target.value)}
              placeholder="Buscar por nombre, código o SIGERD..."
              className="h-8 w-full rounded-lg border border-slate-200 bg-white pr-3 pl-8 text-xs text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-1">
            {(
              [
                { id: "all", label: "Todos" },
                { id: "active", label: "Activos" },
                { id: "unassigned", label: "Pendientes de Matrícula" },
              ] as const
            ).map((filter) => (
              <button
                key={filter.id}
                type="button"
                onClick={() => onChangeStatusFilter(filter.id)}
                className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors ${
                  statusFilter === filter.id
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:bg-slate-200/70 hover:text-slate-900"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {/* Student Roster List */}
        {students.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={<ContactRound className="size-8" />}
              title={
                totalStudentsCount === 0 ? "Sin expedientes estudiantiles" : "Sin coincidencias"
              }
              description={
                totalStudentsCount === 0
                  ? "Registre el primer expediente estudiantil permanente para habilitar tutores y matrículas."
                  : "Ningún estudiante coincide con el filtro actual."
              }
            />
          </div>
        ) : (
          <div className="max-h-[540px] divide-y divide-slate-100 overflow-y-auto">
            {students.map((student) => {
              const isSelected = selectedStudent?.id === student.id;
              const enrollment = student.latestEnrollment;

              return (
                <button
                  key={student.id}
                  type="button"
                  onClick={() => onSelectStudent(student.id)}
                  className={`group flex w-full items-center justify-between px-4 py-3 text-left transition-all ${
                    isSelected
                      ? "border-l-2 border-l-slate-900 bg-slate-50/95"
                      : "hover:bg-slate-50/60"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex size-9 shrink-0 items-center justify-center rounded-lg border font-mono text-xs font-semibold transition-colors ${
                        isSelected
                          ? "border-slate-900 bg-slate-900 text-white"
                          : student.isActive
                            ? "border-slate-200 bg-slate-100 text-slate-800"
                            : "border-slate-200 bg-slate-50 text-slate-400"
                      }`}
                    >
                      {getInitials(student.fullName)}
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span
                          className={`text-xs font-semibold ${
                            student.isActive ? "text-slate-900" : "text-slate-400 line-through"
                          }`}
                        >
                          {student.fullName}
                        </span>
                        <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] font-medium text-slate-700">
                          {student.studentCode}
                        </span>
                      </div>

                      <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                        {enrollment && enrollment.status === "Active" ? (
                          <span className="inline-flex items-center gap-1 font-medium text-emerald-700">
                            <span className="size-1.5 rounded-full bg-emerald-500" />
                            {enrollment.gradeLevelCode}-{enrollment.sectionCode} (
                            {enrollment.academicYearCode})
                          </span>
                        ) : (
                          <span className="text-amber-600">Sin sección activa</span>
                        )}
                        <span>·</span>
                        <span className="tabular-nums">{student.guardians.length} tutor(es)</span>
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
            })}
          </div>
        )}
      </div>

      {/* Right Detail Pane: 360° Permanent Student Dossier */}
      <div className="flex flex-col overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] lg:col-span-7">
        {!selectedStudent ? (
          <div className="flex flex-1 flex-col justify-center p-10">
            <EmptyState
              icon={<ContactRound className="size-8" />}
              title="Seleccione un expediente estudiantil"
              description="Elija un estudiante del padrón izquierdo para inspeccionar su ficha permanente 360°, tutores familiares y matrícula anual."
            />
          </div>
        ) : (
          <div key={selectedStudent.id} className="animate-fade-in-up flex flex-col">
            {/* Dossier Header */}
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 bg-slate-50/40 px-5 py-4">
              <div className="flex items-center gap-3.5">
                <div className="flex size-12 items-center justify-center rounded-xl bg-slate-950 font-mono text-sm font-bold text-white shadow-xs">
                  {getInitials(selectedStudent.fullName)}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-bold tracking-tight text-slate-900">
                      {selectedStudent.fullName}
                    </h3>
                    <span className="rounded-md bg-slate-900 px-2 py-0.5 font-mono text-xs font-semibold text-white">
                      {selectedStudent.studentCode}
                    </span>
                    {selectedStudent.isActive ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-800">
                        <span className="size-1.5 rounded-full bg-emerald-500" />
                        Expediente Activo
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                        Inactivo
                      </span>
                    )}
                  </div>

                  <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1 font-mono tabular-nums">
                      <Calendar className="size-3.5 text-slate-400" />
                      Nac.: {selectedStudent.birthDate} (
                      {calculateStudentAge(selectedStudent.birthDate)} años)
                    </span>
                    <span>·</span>
                    <span className="inline-flex items-center gap-1 font-mono">
                      <Fingerprint className="size-3.5 text-slate-400" />
                      SIGERD:{" "}
                      <strong className="font-semibold text-slate-700">
                        {selectedStudent.sigerdExternalId ?? "No asignado"}
                      </strong>
                    </span>
                  </div>
                </div>
              </div>

              {canManageStudents ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={actionLoadingId === selectedStudent.id}
                  onClick={() =>
                    onToggleStudentActive(
                      selectedStudent.id,
                      selectedStudent.studentCode,
                      selectedStudent.isActive,
                    )
                  }
                  className="h-8 gap-1.5 text-xs"
                >
                  {selectedStudent.isActive ? (
                    <>
                      <UserMinus className="size-3.5 text-rose-600" />
                      Desactivar Expediente
                    </>
                  ) : (
                    <>
                      <UserCheck className="size-3.5 text-emerald-600" />
                      Reactivar Expediente
                    </>
                  )}
                </Button>
              ) : null}
            </div>

            {/* Section 1: Annual Section Enrollment Status & Quick Enroll Drawer */}
            <div className="border-b border-slate-100 p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <GraduationCap className="size-4 text-slate-700" />
                  <h4 className="text-xs font-semibold tracking-wider text-slate-700 uppercase">
                    Ubicación y Matrícula Escolar Anual
                  </h4>
                </div>

                {canManageEnrollments && selectedStudent.isActive ? (
                  <Button
                    type="button"
                    size="sm"
                    variant={openDrawer === "enroll" ? "outline" : "default"}
                    disabled={availableSections.length === 0}
                    onClick={() => onOpenQuickEnroll(selectedStudent.id)}
                    className="h-7 gap-1 px-2.5 text-xs"
                  >
                    {openDrawer === "enroll" ? (
                      <>
                        <X className="size-3.5" />
                        Cerrar
                      </>
                    ) : (
                      <>
                        <ClipboardCheck className="size-3.5" />
                        Matricular en Sección
                      </>
                    )}
                  </Button>
                ) : null}
              </div>

              {/* Quick Enroll Slide-Down Drawer */}
              {canManageEnrollments && openDrawer === "enroll" ? (
                <form
                  onSubmit={onSubmitEnroll}
                  className="animate-slide-down mt-3 rounded-lg border border-slate-200 bg-slate-50/80 p-4"
                  noValidate
                >
                  <div className="mb-2.5 flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-800">
                      Inscribir a {selectedStudent.firstName} en una sección con cupo
                    </span>
                    <span className="font-mono text-[11px] text-slate-400">
                      Validación de capacidad en tiempo real
                    </span>
                  </div>

                  <input type="hidden" {...enrollForm.register("studentId")} />

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div className="space-y-1 sm:col-span-2">
                      <Label htmlFor="quick-enroll-section" className="text-xs">
                        Sección y Aula Disponible
                      </Label>
                      <select
                        id="quick-enroll-section"
                        className="h-8 w-full rounded-md border border-slate-200 bg-white px-2.5 text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
                        {...enrollForm.register("sectionId")}
                      >
                        <option value="">Seleccione sección con cupo...</option>
                        {availableSections.map((section) => (
                          <option key={section.sectionId} value={section.sectionId}>
                            [{section.academicYearCode}] {section.gradeLevelCode}-
                            {section.sectionCode} · {section.gradeLevelName} (Libres:{" "}
                            {section.availableSeats}/{section.capacity})
                          </option>
                        ))}
                      </select>
                      <FormFieldError message={enrollForm.formState.errors.sectionId?.message} />
                    </div>

                    <div className="flex items-end justify-end gap-2">
                      <Button
                        type="submit"
                        size="sm"
                        disabled={isSubmitting}
                        className="h-8 w-full text-xs"
                      >
                        {isSubmitting ? "Matriculando..." : "Confirmar Matrícula"}
                      </Button>
                    </div>
                  </div>
                </form>
              ) : null}

              {/* Current Enrollment Card */}
              <div className="mt-3">
                {selectedStudent.latestEnrollment ? (
                  (() => {
                    const enr = selectedStudent.latestEnrollment;
                    const statusMeta = getEnrollmentStatusMeta(enr.status);
                    return (
                      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200/80 bg-slate-50/50 px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span className="inline-flex items-center rounded-lg bg-slate-900 px-2.5 py-1 font-mono text-xs font-bold text-white">
                            {enr.gradeLevelCode}-{enr.sectionCode}
                          </span>
                          <div>
                            <div className="text-xs font-semibold text-slate-900">
                              {enr.gradeLevelName} · Sección {enr.sectionCode}
                            </div>
                            <div className="font-mono text-[11px] text-slate-500">
                              Año Escolar {enr.academicYearCode}
                            </div>
                          </div>
                        </div>

                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${statusMeta.badgeClass}`}
                        >
                          <span className={`size-1.5 rounded-full ${statusMeta.dotClass}`} />
                          {statusMeta.label}
                        </span>
                      </div>
                    );
                  })()
                ) : (
                  <div className="rounded-lg border border-dashed border-amber-300/80 bg-amber-50/40 px-4 py-3 text-xs text-amber-900">
                    Este expediente aún no tiene matrícula activa en el año escolar vigente.
                    {availableSections.length === 0
                      ? " (Habilite primero una sección con cupos en Estructura Académica)."
                      : " Utilice el botón «Matricular en Sección» para asignarle un aula."}
                  </div>
                )}
              </div>
            </div>

            {/* Section 2: Family Guardians & Granular Permissions */}
            <div className="p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <HeartHandshake className="size-4 text-slate-700" />
                  <h4 className="text-xs font-semibold tracking-wider text-slate-700 uppercase">
                    Núcleo Familiar y Autorizaciones ({selectedStudent.guardians.length})
                  </h4>
                </div>

                {canManageStudents ? (
                  <Button
                    type="button"
                    size="sm"
                    variant={openDrawer === "link-guardian" ? "outline" : "default"}
                    disabled={guardians.length === 0}
                    onClick={() => onToggleDrawer("link-guardian")}
                    className="h-7 gap-1 px-2.5 text-xs"
                  >
                    {openDrawer === "link-guardian" ? (
                      <>
                        <X className="size-3.5" />
                        Cerrar
                      </>
                    ) : (
                      <>
                        <UserPlus className="size-3.5" />
                        Vincular Tutor
                      </>
                    )}
                  </Button>
                ) : null}
              </div>

              {/* Collapsible Drawer: Link Guardian */}
              {canManageStudents && openDrawer === "link-guardian" ? (
                <form
                  onSubmit={onSubmitLinkGuardian}
                  className="animate-slide-down mt-3 rounded-lg border border-slate-200 bg-slate-50/80 p-4"
                  noValidate
                >
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-800">
                      Vincular Responsable Familiar a {selectedStudent.firstName}
                    </span>
                    <span className="font-mono text-[11px] text-slate-400">
                      Permisos ABAC Familiares
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="space-y-1">
                      <Label htmlFor="link-guardian-id" className="text-xs">
                        Tutor Registrado
                      </Label>
                      <select
                        id="link-guardian-id"
                        className="h-8 w-full rounded-md border border-slate-200 bg-white px-2.5 text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
                        {...linkGuardianForm.register("guardianId")}
                      >
                        <option value="">Seleccione responsable...</option>
                        {guardians.map((guardian) => (
                          <option key={guardian.id} value={guardian.id}>
                            {guardian.fullName} ({guardian.email})
                          </option>
                        ))}
                      </select>
                      <FormFieldError
                        message={linkGuardianForm.formState.errors.guardianId?.message}
                      />
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="link-relationship" className="text-xs">
                        Parentesco / Vínculo
                      </Label>
                      <Input
                        id="link-relationship"
                        list="guardian-relationship-list"
                        placeholder="Ej. Madre, Padre, Tutor Legal"
                        className="h-8 bg-white text-xs"
                        {...linkGuardianForm.register("relationshipType")}
                      />
                      <datalist id="guardian-relationship-list">
                        {GUARDIAN_RELATIONSHIP_SUGGESTIONS.map((item) => (
                          <option key={item} value={item} />
                        ))}
                      </datalist>
                      <FormFieldError
                        message={linkGuardianForm.formState.errors.relationshipType?.message}
                      />
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
                    <label className="flex cursor-pointer items-center gap-2 rounded-md border border-slate-200 bg-white px-2.5 py-2 text-xs text-slate-700">
                      <input
                        type="checkbox"
                        className="rounded border-slate-300"
                        {...linkGuardianForm.register("hasAcademicAccess")}
                      />
                      <span>Seguimiento Académico</span>
                    </label>

                    <label className="flex cursor-pointer items-center gap-2 rounded-md border border-slate-200 bg-white px-2.5 py-2 text-xs text-slate-700">
                      <input
                        type="checkbox"
                        className="rounded border-slate-300"
                        {...linkGuardianForm.register("hasFinancialResponsibility")}
                      />
                      <span>Responsable Financiero</span>
                    </label>

                    <label className="flex cursor-pointer items-center gap-2 rounded-md border border-slate-200 bg-white px-2.5 py-2 text-xs text-slate-700">
                      <input
                        type="checkbox"
                        className="rounded border-slate-300"
                        {...linkGuardianForm.register("hasPickupAuthorization")}
                      />
                      <span>Recogida Autorizada</span>
                    </label>
                  </div>

                  <div className="mt-3 flex justify-end gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => onToggleDrawer("link-guardian")}
                      className="h-7 text-xs"
                    >
                      Cancelar
                    </Button>
                    <Button type="submit" size="sm" disabled={isSubmitting} className="h-7 text-xs">
                      {isSubmitting ? "Vinculando..." : "Guardar Vínculo"}
                    </Button>
                  </div>
                </form>
              ) : null}

              {/* Linked Guardians List */}
              {selectedStudent.guardians.length === 0 ? (
                <div className="mt-3 rounded-lg border border-dashed border-slate-200 bg-slate-50/40 px-4 py-6 text-center text-xs text-slate-500">
                  No hay tutores familiares vinculados a este estudiante.
                  {guardians.length === 0
                    ? " Primero registre un tutor en la pestaña «Tutores y Núcleo Familiar»."
                    : " Use «Vincular Tutor» para asociar un responsable con permisos granulares."}
                </div>
              ) : (
                <div className="mt-3 space-y-2.5">
                  {selectedStudent.guardians.map((g) => (
                    <div
                      key={g.linkId}
                      className="rounded-xl border border-slate-200/80 bg-white p-3.5 transition-colors hover:border-slate-300"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-slate-900">
                              {g.fullName}
                            </span>
                            <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                              {g.relationshipType}
                            </span>
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
                            <span className="inline-flex items-center gap-1 font-mono">
                              <Mail className="size-3 text-slate-400" />
                              {g.email}
                            </span>
                            {g.phoneNumber ? (
                              <span className="inline-flex items-center gap-1 font-mono">
                                <Phone className="size-3 text-slate-400" />
                                {g.phoneNumber}
                              </span>
                            ) : null}
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5">
                          {g.hasAcademicAccess ? (
                            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-800">
                              <BadgeCheck className="size-3" />
                              Académico
                            </span>
                          ) : null}
                          {g.hasFinancialResponsibility ? (
                            <span className="inline-flex items-center gap-1 rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-[10px] font-medium text-sky-800">
                              <CreditCard className="size-3" />
                              Financiero
                            </span>
                          ) : null}
                          {g.hasPickupAuthorization ? (
                            <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-700">
                              <ShieldCheck className="size-3" />
                              Recogida
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
