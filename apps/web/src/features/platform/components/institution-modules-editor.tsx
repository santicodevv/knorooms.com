"use client";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ModuleSelector } from "./module-selector";
import { useInstitutionModules } from "../hooks/use-institution-modules";
import type { ModuleSettings, ProductModule } from "../schemas/institution-management-schemas";
export function InstitutionModulesEditor({
  id,
  initial,
  catalog,
  csrfToken,
  onDirtyChange,
  onSaved,
}: {
  id: string;
  initial: ModuleSettings;
  catalog: ProductModule[];
  csrfToken: string;
  onDirtyChange: (dirty: boolean) => void;
  onSaved: () => void;
}) {
  const s = useInstitutionModules(id, initial, csrfToken, onSaved);
  useEffect(() => {
    onDirtyChange(s.dirty);
    return () => onDirtyChange(false);
  }, [s.dirty, onDirtyChange]);
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-sm font-bold">Módulos de la institución</h2>
        <p className="text-muted mt-1 text-xs">
          Selecciona las capacidades disponibles para el colegio. Desactivarlas conserva sus datos
          históricos.
        </p>
      </div>
      <ModuleSelector
        catalog={catalog}
        selected={s.selected}
        onChange={s.setSelected}
        disabled={s.busy}
      />
      <div className="flex flex-wrap items-center justify-between gap-4 border-t pt-5">
        <p className="text-xs text-slate-500" role="status">
          {s.dirty ? "Hay cambios pendientes de guardar." : "Configuración actualizada."}
        </p>
        <div className="flex gap-2">
          <Button variant="outline" disabled={s.busy} onClick={s.reload}>
            Descartar cambios
          </Button>
          <Button
            className="bg-blue-600 hover:bg-blue-700"
            disabled={s.busy || !s.dirty}
            onClick={s.save}
          >
            {s.busy ? "Guardando…" : "Guardar módulos"}
          </Button>
        </div>
      </div>
    </div>
  );
}
