import { serverApiFetch } from "@/lib/api/server-api";
import { ProblemAlert } from "@/components/api/problem-alert";
import { statusLabels, type EffectiveAccess } from "../schemas/subscription-schemas";
export async function SchoolCommercialStatus() {
  const result = await serverApiFetch<EffectiveAccess>("/api/tenant/capabilities");
  if (!result.ok) return <ProblemAlert problem={result.problem} />;
  const access = result.data;
  const restricted = access.modules.filter((m) => m.canRead && !m.canWrite);
  if (restricted.length === 0) return null;
  return (
    <section
      aria-label="Módulos de la institución"
      className="mb-4 rounded-lg border bg-white p-4 text-sm"
    >
      <strong>Acceso: {statusLabels[access.status]}</strong>
      {restricted.length > 0 ? (
        <p className="mt-1 text-slate-600">
          Consulta histórica disponible. Sin cambios en: {restricted.map((m) => m.name).join(", ")}.
          Contacte a administración para revisar los módulos habilitados.
        </p>
      ) : (
        <p className="mt-1 text-slate-600">
          Módulos académicos habilitados según la configuración del colegio y sus permisos.
        </p>
      )}
    </section>
  );
}
