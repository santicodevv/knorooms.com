import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
export function SchoolPagination({
  page,
  pages,
  total,
  onPage,
  variant = "default",
}: {
  page: number;
  pages: number;
  total: number;
  onPage: (page: number) => void;
  variant?: "default" | "school";
}) {
  const buttonClassName =
    variant === "school"
      ? "school:h-auto school:min-h-0 school:rounded-lg school:border-0 school:bg-school-subtle school:px-4 school:py-2 school:text-[13px] school:leading-[18px] school:font-medium school:disabled:text-school-muted school:disabled:opacity-100"
      : undefined;
  return (
    <footer
      className={cn(
        "text-muted flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 p-4 text-xs",
        variant === "school" &&
          "border-school-border text-school-secondary px-6 py-3.5 text-[13px] leading-[18px]",
      )}
    >
      <span>
        {total} registro{total === 1 ? "" : "s"} · Página {page} de {pages}
      </span>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className={buttonClassName}
          disabled={page === 1}
          onClick={() => onPage(page - 1)}
        >
          Anterior
        </Button>
        <Button
          variant="outline"
          size="sm"
          className={buttonClassName}
          disabled={page === pages}
          onClick={() => onPage(page + 1)}
        >
          Siguiente
        </Button>
      </div>
    </footer>
  );
}
