import { Button } from "@/components/ui/button";
export function SchoolPagination({
  page,
  pages,
  total,
  onPage,
}: {
  page: number;
  pages: number;
  total: number;
  onPage: (page: number) => void;
}) {
  return (
    <footer className="text-muted flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 p-4 text-xs">
      <span>
        {total} registro{total === 1 ? "" : "s"} · Página {page} de {pages}
      </span>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" disabled={page === 1} onClick={() => onPage(page - 1)}>
          Anterior
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={page === pages}
          onClick={() => onPage(page + 1)}
        >
          Siguiente
        </Button>
      </div>
    </footer>
  );
}
