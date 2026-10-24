"use client";
import { useState } from "react";
import toast from "react-hot-toast";
import { updateInstitutionModules, getInstitutionModules } from "../api/institution-management-api";
import type { ModuleSettings } from "../schemas/institution-management-schemas";
import { useUnsavedChanges } from "./use-unsaved-changes";
export function useInstitutionModules(
  id: string,
  initial: ModuleSettings,
  csrfToken: string,
  onSaved?: () => void,
) {
  const [data, setData] = useState(initial);
  const [selected, setSelected] = useState(initial.enabledModules);
  const [busy, setBusy] = useState(false);
  const dirty = [...selected].sort().join() !== [...data.enabledModules].sort().join();
  useUnsavedChanges(dirty);
  async function save() {
    setBusy(true);
    const toastId = toast.loading("Guardando módulos…");
    try {
      const result = await updateInstitutionModules(id, selected, data.version, csrfToken);
      if (result.ok) {
        setData(result.data);
        setSelected(result.data.enabledModules);
        toast.success("Módulos actualizados. Los datos históricos se conservan.", { id: toastId });
        onSaved?.();
        return true;
      } else {
        toast.error(result.problem.detail ?? "No se pudo guardar.", { id: toastId });
      }
    } finally {
      setBusy(false);
    }
  }
  async function reload() {
    if (dirty && !window.confirm("¿Descartar los cambios pendientes y cargar la versión actual?"))
      return;
    const result = await getInstitutionModules(id);
    if (result.ok) {
      setData(result.data);
      setSelected(result.data.enabledModules);
    } else toast.error(result.problem.detail ?? "No se pudieron actualizar los módulos.");
  }
  return { selected, setSelected, busy, dirty, save, reload };
}
