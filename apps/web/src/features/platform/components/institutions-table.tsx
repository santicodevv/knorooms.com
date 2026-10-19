import { Building2, ExternalLink, PauseCircle, PlayCircle } from "lucide-react";
import { ProblemAlert } from "@/components/api/problem-alert";
import { EmptyState } from "@/components/shared/empty-state";
import { RefreshButton } from "@/components/shared/refresh-button";
import { SectionCard } from "@/components/shared/section-card";
import { InstitutionStatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { InstitutionDto, ProblemDetails } from "@/lib/api/types";

interface InstitutionsTableProps {
  institutions: InstitutionDto[];
  listProblem: ProblemDetails | null;
  refreshing: boolean;
  busyInstitutionId: string | null;
  baseDomain: string;
  portSuffix: string;
  proto: string;
  onRefresh: () => void;
  onToggleStatus: (institution: InstitutionDto) => void;
}

export function InstitutionsTable({
  institutions,
  listProblem,
  refreshing,
  busyInstitutionId,
  baseDomain,
  portSuffix,
  proto,
  onRefresh,
  onToggleStatus,
}: InstitutionsTableProps) {
  return (
    <SectionCard
      icon={<Building2 className="size-5 text-slate-800" />}
      title="Instituciones Registradas"
      description={
        <>
          Colegios registrados en el catálogo global desde{" "}
          <code className="font-mono">GET /api/platform/institutions</code>.
        </>
      }
      headerAction={<RefreshButton onClick={onRefresh} loading={refreshing} />}
    >
      {listProblem ? (
        <div className="mb-4">
          <ProblemAlert problem={listProblem} />
        </div>
      ) : null}

      {institutions.length === 0 ? (
        <EmptyState
          title="No hay instituciones registradas en la plataforma."
          description="Utilice el formulario de registro para dar de alta el primer colegio."
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Institución</TableHead>
              <TableHead>Subdominio (Slug)</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Fecha de Registro</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {institutions.map((institution) => {
              const tenantUrl = `${proto}://${institution.slug}.${baseDomain}${portSuffix}`;
              const isBusy = busyInstitutionId === institution.id;
              return (
                <TableRow key={institution.id}>
                  <TableCell>
                    <div className="font-medium text-slate-900">{institution.name}</div>
                    <div className="font-mono text-xs text-slate-400">{institution.id}</div>
                  </TableCell>
                  <TableCell>
                    <a
                      href={tenantUrl}
                      className="inline-flex items-center gap-1 font-mono text-xs font-medium text-slate-800 underline-offset-4 hover:underline"
                    >
                      {institution.slug}.{baseDomain}
                      <ExternalLink className="size-3" />
                    </a>
                  </TableCell>
                  <TableCell>
                    <InstitutionStatusBadge status={institution.status} />
                  </TableCell>
                  <TableCell className="text-xs text-slate-600">
                    {new Date(institution.createdAt).toLocaleString("es-DO", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      type="button"
                      variant={institution.status === "Active" ? "outline" : "default"}
                      size="sm"
                      disabled={isBusy}
                      onClick={() => onToggleStatus(institution)}
                    >
                      {institution.status === "Active" ? (
                        <>
                          <PauseCircle className="size-4 text-amber-600" />
                          Suspender
                        </>
                      ) : (
                        <>
                          <PlayCircle className="size-4" />
                          Activar
                        </>
                      )}
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </SectionCard>
  );
}
