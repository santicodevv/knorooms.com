import type { BaseSyntheticEvent } from "react";
import type { UseFormReturn } from "react-hook-form";
import { HeartHandshake, Mail, Phone, Plus, ShieldCheck, X } from "lucide-react";
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
import { getInitials } from "@/features/school/academic/schemas/academic-schemas";
import type { StudentsDrawerKind } from "@/features/school/students/hooks/use-students-workspace";
import type { CreateGuardianFormValues } from "@/features/school/students/schemas/students-schemas";
import type { GuardianDto } from "@/lib/api/types";

interface GuardiansDirectoryPanelProps {
  guardians: GuardianDto[];
  canManageStudents: boolean;
  openDrawer: StudentsDrawerKind;
  onToggleDrawer: (drawer: "guardian") => void;
  guardianForm: UseFormReturn<CreateGuardianFormValues>;
  onSubmitGuardian: (event?: BaseSyntheticEvent) => Promise<void>;
  isSubmitting: boolean;
}

export function GuardiansDirectoryPanel({
  guardians,
  canManageStudents,
  openDrawer,
  onToggleDrawer,
  guardianForm,
  onSubmitGuardian,
  isSubmitting,
}: GuardiansDirectoryPanelProps) {
  return (
    <div className="animate-fade-in-up overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">
            Directorio Institucional de Tutores y Responsables Familiares
          </h3>
          <p className="text-xs text-slate-500">
            Padrón de padres, madres y tutores legales autorizados para seguimiento académico,
            financiero y recogida
          </p>
        </div>

        {canManageStudents ? (
          <Button
            type="button"
            size="sm"
            variant={openDrawer === "guardian" ? "outline" : "default"}
            onClick={() => onToggleDrawer("guardian")}
            className="h-8 gap-1.5 px-3 text-xs"
          >
            {openDrawer === "guardian" ? (
              <>
                <X className="size-3.5" />
                Cerrar
              </>
            ) : (
              <>
                <Plus className="size-3.5" />
                Registrar Tutor Familiar
              </>
            )}
          </Button>
        ) : null}
      </div>

      {/* Collapsible Drawer: Create Guardian */}
      {canManageStudents && openDrawer === "guardian" ? (
        <form
          onSubmit={onSubmitGuardian}
          className="animate-slide-down border-b border-slate-200/80 bg-slate-50/70 p-5"
          noValidate
        >
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-800">
              Alta de Responsable o Tutor Familiar
            </span>
            <span className="font-mono text-[11px] text-slate-400">
              Vinculación automática por correo si existe cuenta
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-1">
              <Label htmlFor="guardian-fullName" className="text-xs">
                Nombre Completo
              </Label>
              <Input
                id="guardian-fullName"
                placeholder="Ej. Laura Ureña de Rodríguez"
                className="h-8 bg-white text-xs"
                {...guardianForm.register("fullName")}
              />
              <FormFieldError message={guardianForm.formState.errors.fullName?.message} />
            </div>

            <div className="space-y-1">
              <Label htmlFor="guardian-email" className="text-xs">
                Correo Electrónico
              </Label>
              <Input
                id="guardian-email"
                type="email"
                placeholder="laura.urena@familia.do"
                className="h-8 bg-white font-mono text-xs"
                {...guardianForm.register("email")}
              />
              <FormFieldError message={guardianForm.formState.errors.email?.message} />
            </div>

            <div className="space-y-1">
              <Label htmlFor="guardian-phone" className="text-xs">
                Teléfono de Contacto (Opcional)
              </Label>
              <Input
                id="guardian-phone"
                placeholder="809-555-0192"
                className="h-8 bg-white font-mono text-xs"
                {...guardianForm.register("phoneNumber")}
              />
              <FormFieldError message={guardianForm.formState.errors.phoneNumber?.message} />
            </div>
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => onToggleDrawer("guardian")}
              className="h-8 text-xs"
            >
              Cancelar
            </Button>
            <Button type="submit" size="sm" disabled={isSubmitting} className="h-8 text-xs">
              {isSubmitting ? "Registrando..." : "Guardar Tutor"}
            </Button>
          </div>
        </form>
      ) : null}

      {guardians.length === 0 ? (
        <div className="p-8">
          <EmptyState
            icon={<HeartHandshake className="size-8" />}
            title="Sin tutores familiares registrados"
            description="Registre los padres o tutores legales para luego vincularlos a los expedientes estudiantiles."
          />
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/60 hover:bg-slate-50/60">
              <TableHead className="text-xs font-semibold text-slate-600">
                Responsable Familiar
              </TableHead>
              <TableHead className="text-xs font-semibold text-slate-600">Contacto</TableHead>
              <TableHead className="text-xs font-semibold text-slate-600">Cuenta Portal</TableHead>
              <TableHead className="text-right text-xs font-semibold text-slate-600">
                Estudiantes Vinculados
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {guardians.map((guardian) => (
              <TableRow key={guardian.id} className="transition-colors hover:bg-slate-50/70">
                <TableCell>
                  <div className="flex items-center gap-2.5">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-slate-900 font-mono text-xs font-semibold text-white">
                      {getInitials(guardian.fullName)}
                    </div>
                    <span className="text-xs font-semibold text-slate-900">
                      {guardian.fullName}
                    </span>
                  </div>
                </TableCell>

                <TableCell>
                  <div className="space-y-0.5 text-xs text-slate-600">
                    <div className="flex items-center gap-1.5 font-mono text-[11px]">
                      <Mail className="size-3 text-slate-400" />
                      {guardian.email}
                    </div>
                    {guardian.phoneNumber ? (
                      <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-500">
                        <Phone className="size-3 text-slate-400" />
                        {guardian.phoneNumber}
                      </div>
                    ) : null}
                  </div>
                </TableCell>

                <TableCell>
                  {guardian.userAccountId ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-800">
                      <ShieldCheck className="size-3" />
                      Cuenta Vinculada
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                      Sin sesión previa
                    </span>
                  )}
                </TableCell>

                <TableCell className="text-right">
                  <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 font-mono text-xs font-semibold text-slate-800 tabular-nums">
                    {guardian.linkedStudentsCount} estudiante(s)
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
