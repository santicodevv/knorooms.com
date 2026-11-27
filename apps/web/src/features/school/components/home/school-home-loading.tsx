import { Skeleton } from "@/components/ui/skeleton";
export function SchoolHomeLoading() {
  return (
    <div role="status" aria-label="Cargando el portal" className="bg-school-app">
      <span className="sr-only">Cargando el portal…</span>
      <Skeleton className="mb-3 h-10 w-64 max-w-full" />
      <Skeleton className="mb-6 h-5 w-96 max-w-full" />
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((index) => (
          <Skeleton key={index} className="h-20" />
        ))}
      </div>
      <Skeleton className="mb-6 h-32 w-full" />
      <Skeleton className="h-96 w-full" />
    </div>
  );
}
