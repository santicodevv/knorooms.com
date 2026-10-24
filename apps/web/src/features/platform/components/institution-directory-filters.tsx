import { Search, SlidersHorizontal, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  administratorLabels,
  type DirectoryFilters,
} from "../schemas/institution-management-schemas";
const selectClass =
  "h-[38px] min-w-0 rounded-[9px] border border-control bg-white px-3 text-xs text-slate-500 md:max-w-48";
export function InstitutionDirectoryFilters({
  filters,
  loading,
  onApply,
  onRefresh,
}: {
  filters: DirectoryFilters;
  loading: boolean;
  onApply: (next: Partial<DirectoryFilters>) => void;
  onRefresh: () => void;
}) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onRefresh();
      }}
      className="flex flex-wrap items-center gap-2.5 p-4 sm:px-[22px] sm:py-5"
    >
      <div className="relative min-w-full flex-1 md:min-w-52">
        <Search className="text-muted absolute top-3 left-3 size-4" />
        <Input
          aria-label="Buscar instituciones"
          className="pl-9"
          placeholder="Buscar por nombre, subdominio o correo…"
          value={filters.search}
          onChange={(e) => onApply({ search: e.target.value })}
        />
      </div>
      <select
        aria-label="Filtrar por estado"
        className={selectClass}
        value={filters.status}
        onChange={(e) => onApply({ status: e.target.value })}
      >
        <option value="">Todos los estados</option>
        <option value="Active">Activas</option>
        <option value="Suspended">Suspendidas</option>
      </select>
      <select
        aria-label="Filtrar por administrador"
        className={selectClass}
        value={filters.administrator}
        onChange={(e) => onApply({ administrator: e.target.value })}
      >
        <option value="">Todos los administradores</option>
        {Object.entries(administratorLabels).map(([value, label]) => (
          <option value={value} key={value}>
            {label}
          </option>
        ))}
      </select>
      <Button
        variant="outline"
        onClick={() => onApply({ search: "", status: "", administrator: "", page: 1 })}
      >
        <SlidersHorizontal />
        Limpiar
      </Button>
      <Button
        type="submit"
        variant="ghost"
        size="icon"
        aria-label="Actualizar listado"
        disabled={loading}
      >
        <RefreshCw className={loading ? "animate-spin" : ""} />
      </Button>
    </form>
  );
}
