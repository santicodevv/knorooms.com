"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="es">
      <body className="flex min-h-screen items-center justify-center bg-slate-50 p-6 font-sans text-slate-900">
        <div className="w-full max-w-md rounded-xl border border-red-200 bg-white p-6 shadow-xs">
          <h1 className="text-lg font-semibold text-red-700">Error crítico de la aplicación</h1>
          <p className="mt-2 text-sm text-slate-600">
            {error.message || "Ha ocurrido un fallo inesperado en el contenedor principal."}
          </p>
          {error.digest ? (
            <p className="mt-1 font-mono text-xs text-slate-400">Digest: {error.digest}</p>
          ) : null}
          <button
            type="button"
            onClick={reset}
            className="mt-4 inline-flex h-9 items-center justify-center rounded-md bg-slate-900 px-4 text-sm font-medium text-white hover:bg-slate-800"
          >
            Recargar aplicación
          </button>
        </div>
      </body>
    </html>
  );
}
