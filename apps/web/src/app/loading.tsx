export default function Loading() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 px-4 py-12">
      <div className="size-8 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900" />
      <p className="text-sm font-medium text-slate-600">Cargando información...</p>
    </div>
  );
}
