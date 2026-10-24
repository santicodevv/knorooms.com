"use client";
import {
  Users,
  GraduationCap,
  ClipboardCheck,
  CalendarCheck,
  BookOpen,
  FileText,
  Puzzle,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ActionDialog } from "@/components/shared/action-dialog";
import { useModuleSelection } from "../hooks/use-module-selection";
import { moduleDescriptions, type ProductModule } from "../schemas/institution-management-schemas";
const icons: Record<string, typeof Users> = {
  students: Users,
  academic: GraduationCap,
  enrollments: ClipboardCheck,
  attendance: CalendarCheck,
  grading: BookOpen,
  reportcards: FileText,
  moodle: Puzzle,
};
export function ModuleSelector({
  catalog,
  selected,
  onChange,
  disabled = false,
}: {
  catalog: ProductModule[];
  selected: string[];
  onChange: (values: string[]) => void;
  disabled?: boolean;
}) {
  const s = useModuleSelection(selected, onChange, catalog);
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        {catalog.map((mod) => {
          const Icon = icons[mod.code] ?? Puzzle;
          const checked = selected.includes(mod.code);
          return (
            <label
              key={mod.code}
              className={`relative flex cursor-pointer flex-col rounded-[11px] border p-4 transition-colors focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-blue-500 ${!mod.available ? "cursor-not-allowed border-slate-200 bg-slate-50" : checked ? "border-[#8cb2ff] bg-[#f9fbff] ring-1 ring-[#e8efff]" : "border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50/20"}`}
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="rounded-[9px] bg-blue-50 p-2 text-blue-600">
                  <Icon className="size-4" />
                </span>
                <input
                  aria-label={mod.name}
                  type="checkbox"
                  className="size-4 cursor-pointer accent-blue-600 disabled:cursor-not-allowed"
                  checked={checked}
                  disabled={disabled || !mod.available}
                  onChange={(e) => s.toggle(mod.code, e.target.checked)}
                />
              </div>
              <span className="text-xs font-bold">{mod.name}</span>
              <span className="text-muted mt-1.5 text-[11px] leading-5">
                {moduleDescriptions[mod.code]}
              </span>
              {!mod.available ? (
                <span className="mt-3 self-start rounded bg-slate-200 px-2 py-1 text-[11px] text-slate-600">
                  Próximamente · No disponible
                </span>
              ) : mod.dependencies.length > 0 ? (
                <span className="mt-4 flex gap-1.5 rounded-lg bg-white/70 p-2.5 text-[11px] text-slate-600">
                  <CheckCircle2 className="size-3 shrink-0" />
                  Requiere:{" "}
                  {mod.dependencies
                    .map((code) => catalog.find((m) => m.code === code)?.name ?? code)
                    .join(", ")}
                </span>
              ) : null}
            </label>
          );
        })}
      </div>
      <ActionDialog
        open={s.removing.length > 0}
        title="Desactivar módulos relacionados"
        onClose={s.cancel}
      >
        <p className="text-sm text-slate-600">
          Se desactivarán:{" "}
          {s.removing.map((code) => catalog.find((m) => m.code === code)?.name ?? code).join(", ")}.
          Los datos históricos se conservarán.
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={s.cancel}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={s.confirm}>
            Desactivar módulos
          </Button>
        </div>
      </ActionDialog>
    </>
  );
}
