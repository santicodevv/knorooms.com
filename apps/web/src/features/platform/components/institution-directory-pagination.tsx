import { ChevronLeft, ChevronRight } from "lucide-react";
import type { InstitutionPage, DirectoryFilters } from "../schemas/institution-management-schemas";
export function InstitutionDirectoryPagination({
  data,
  pages,
  loading,
  onApply,
}: {
  data: InstitutionPage;
  pages: number[];
  loading: boolean;
  onApply: (next: Partial<DirectoryFilters>) => void;
}) {
  const pageCount = Math.max(1, Math.ceil(data.total / data.pageSize));
  return (
    <footer className="border-divider text-muted flex flex-wrap items-center justify-between gap-4 border-t p-4 text-[11px] sm:px-[22px]">
      <span>
        {data.total
          ? `Mostrando ${(data.page - 1) * data.pageSize + 1}–${Math.min(data.page * data.pageSize, data.total)} de ${data.total} instituciones`
          : "0 instituciones"}
      </span>
      <nav aria-label="Páginas del directorio" className="flex items-center gap-1">
        <button
          aria-label="Página anterior"
          disabled={loading || data.page <= 1}
          onClick={() => onApply({ page: data.page - 1 })}
          className="flex size-8 items-center justify-center rounded-lg border border-slate-200 bg-white disabled:opacity-40"
        >
          <ChevronLeft className="size-3.5" />
        </button>
        {pages.map((page) => (
          <button
            key={page}
            aria-label={`Página ${page}`}
            aria-current={page === data.page ? "page" : undefined}
            disabled={loading}
            onClick={() => onApply({ page })}
            className={`size-8 rounded-lg border text-xs font-semibold ${page === data.page ? "border-blue-600 bg-blue-600 text-white" : "border-slate-200 bg-white text-slate-500 hover:bg-blue-50"}`}
          >
            {page}
          </button>
        ))}
        <button
          aria-label="Página siguiente"
          disabled={loading || data.page >= pageCount}
          onClick={() => onApply({ page: data.page + 1 })}
          className="flex size-8 items-center justify-center rounded-lg border border-slate-200 bg-white disabled:opacity-40"
        >
          <ChevronRight className="size-3.5" />
        </button>
      </nav>
      <label className="flex items-center gap-2">
        Por página
        <select
          aria-label="Instituciones por página"
          className="border-control h-8 rounded-lg border bg-white px-2"
          value={data.pageSize}
          onChange={(e) => onApply({ pageSize: Number(e.target.value) })}
        >
          {[10, 25, 50].map((value) => (
            <option key={value}>{value}</option>
          ))}
        </select>
      </label>
    </footer>
  );
}
