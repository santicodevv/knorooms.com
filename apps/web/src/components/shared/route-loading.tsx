export function RouteLoading() {
  return (
    <div role="status" className="mx-auto w-full max-w-7xl space-y-6 p-8">
      <span className="sr-only">Cargando información…</span>
      <div className="h-8 w-56 animate-pulse rounded-lg bg-slate-200" />
      <div className="h-16 animate-pulse rounded-xl bg-slate-100" />
      <div className="space-y-4 rounded-xl border bg-white p-6">
        {Array.from({ length: 5 }, (_, index) => (
          <div key={index} className="h-12 animate-pulse rounded bg-slate-100" />
        ))}
      </div>
    </div>
  );
}
