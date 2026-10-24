"use client";
import { useState } from "react";
import toast from "react-hot-toast";
import {
  dependentModules,
  enableDependencies,
  type ProductModule,
} from "../schemas/institution-management-schemas";
export function useModuleSelection(
  selected: string[],
  onChange: (values: string[]) => void,
  catalog: ProductModule[],
) {
  const [removing, setRemoving] = useState<string[]>([]);
  function toggle(code: string, checked: boolean) {
    if (checked) {
      const next = enableDependencies(selected, code, catalog);
      const added = next.filter((x) => x !== code && !selected.includes(x));
      onChange(next);
      if (added.length)
        toast(
          `También se habilitaron: ${added.map((x) => catalog.find((m) => m.code === x)?.name).join(", ")}.`,
          { icon: "ℹ️" },
        );
    } else {
      const affected = dependentModules(selected, code, catalog);
      if (affected.length > 1) setRemoving(affected);
      else onChange(selected.filter((x) => x !== code));
    }
  }
  return {
    removing,
    toggle,
    cancel: () => setRemoving([]),
    confirm: () => {
      onChange(selected.filter((x) => !removing.includes(x)));
      setRemoving([]);
    },
  };
}
