/**
 * Reportador centralizado de errores de los error boundaries.
 *
 * Solo registra metadatos no sensibles: `digest` (correlaciona con el log del
 * servidor de Next.js), el nombre del error y la ruta sin query string ni hash.
 * Nunca registra `message` ni `stack`, porque pueden contener respuestas del BFF.
 */
export type ErrorReport = {
  digest: string | null;
  name: string;
  route: string | null;
};

export function buildErrorReport(
  error: Error & { digest?: string },
  route: string | null = currentRoute(),
): ErrorReport {
  return {
    digest: error.digest ?? null,
    name: error.name || "Error",
    route,
  };
}

export function reportError(error: Error & { digest?: string }): ErrorReport {
  const report = buildErrorReport(error);
  // Única salida a consola permitida en la aplicación (ver eslint.config.mjs).
  console.error("[knorooms] error-boundary", report);
  return report;
}

function currentRoute(): string | null {
  return typeof window === "undefined" ? null : window.location.pathname;
}
