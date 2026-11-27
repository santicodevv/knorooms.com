import { Info } from "lucide-react";
import { getSchoolCapabilities } from "@/features/school/server/school-context";
import { ProblemAlert } from "@/components/api/problem-alert";
import { Badge } from "@/components/ui/badge";
import { statusLabels, type EffectiveAccess } from "../schemas/subscription-schemas";
import type { ApiResult } from "@/lib/api/types";
export async function SchoolCommercialStatus({
  accessResult,
}: { accessResult?: ApiResult<EffectiveAccess> } = {}) {
  const result = accessResult ?? (await getSchoolCapabilities());
  if (!result.ok) return <ProblemAlert problem={result.problem} />;
  const access = result.data;
  const restricted = access.modules.filter((item) => item.canRead && !item.canWrite);
  if (restricted.length === 0) return null;
  return (
    <section
      aria-label="Módulos de la institución"
      className="bg-school-surface rounded-school-card flex items-center gap-3.5 px-4.5 py-4"
    >
      <Info className="text-school-warning size-5 shrink-0" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="text-school-ink text-school-small font-semibold">
          Acceso: {statusLabels[access.status] ?? access.status}
        </p>
        <p className="text-school-secondary text-school-label mt-0.5 font-normal">
          Consulta histórica disponible. Sin cambios en:{" "}
          {restricted.map((item) => item.name).join(", ")}. Contacta a administración para revisar
          los módulos habilitados.
        </p>
      </div>
      <Badge variant="warning" className="school:px-2.5 school:py-1">
        Solo consulta
      </Badge>
    </section>
  );
}
