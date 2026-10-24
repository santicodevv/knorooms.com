"use client";
import { Building2, UserPlus, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  administratorLabels,
  type InstitutionRow,
} from "../schemas/institution-management-schemas";
export function InstitutionDirectoryMobile({
  items,
  loading,
  onOpen,
  onInvite,
}: {
  items: InstitutionRow[];
  loading: boolean;
  onOpen: (id: string, tab?: string) => void;
  onInvite: (row: InstitutionRow) => void;
}) {
  return (
    <div className="divide-y divide-slate-100 lg:hidden" aria-busy={loading}>
      {loading
        ? Array.from({ length: 3 }, (_, index) => (
            <div key={index} className="m-4 h-32 animate-pulse rounded-lg bg-slate-100" />
          ))
        : items.map((row) => (
            <article key={row.id} className="space-y-4 p-5">
              <div className="flex items-start gap-3">
                <span className="rounded-xl bg-blue-50 p-3 text-blue-600">
                  <Building2 className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <button
                    className="text-left text-sm font-semibold"
                    onClick={() => onOpen(row.id)}
                  >
                    {row.name}
                  </button>
                  <p className="mt-1 truncate text-xs text-slate-500">{row.slug}</p>
                </div>
                <span
                  className={`shrink-0 rounded px-2 py-1 text-[11px] ${row.status === "Active" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}
                >
                  {row.status === "Active" ? "Activa" : "Suspendida"}
                </span>
              </div>
              <div className="flex items-start justify-between gap-3 text-xs">
                <div>
                  <p className="font-medium text-slate-700">
                    {administratorLabels[row.administratorState]}
                  </p>
                  {row.administratorEmail ? (
                    <p className="mt-1 break-all text-slate-500">{row.administratorEmail}</p>
                  ) : null}
                </div>
                <span className="shrink-0 text-slate-500">
                  {row.enabledModules.length} de 6 módulos
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => onOpen(row.id)}>
                  Ver ficha
                </Button>
                <Button variant="outline" size="sm" onClick={() => onOpen(row.id, "modules")}>
                  <SlidersHorizontal />
                  Módulos
                </Button>
                <Button variant="ghost" size="sm" onClick={() => onInvite(row)}>
                  <UserPlus />
                  Administrador
                </Button>
              </div>
            </article>
          ))}
    </div>
  );
}
