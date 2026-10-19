import { Ban, ShieldAlert, ShieldCheck, XCircle } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { RefreshButton } from "@/components/shared/refresh-button";
import { SectionCard } from "@/components/shared/section-card";
import { SupportGrantStatusBadge } from "@/components/shared/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { SupportGrantAction } from "@/features/school/api/school-api";
import type { SupportAccessGrantDto } from "@/lib/api/types";

interface SupportGrantsTableProps {
  grants: SupportAccessGrantDto[];
  refreshing: boolean;
  busyGrantId: string | null;
  canManageSupportAccess: boolean;
  onRefresh: () => void;
  onGrantAction: (grant: SupportAccessGrantDto, action: SupportGrantAction) => void;
}

export function SupportGrantsTable({
  grants,
  refreshing,
  busyGrantId,
  canManageSupportAccess,
  onRefresh,
  onGrantAction,
}: SupportGrantsTableProps) {
  return (
    <SectionCard
      icon={<ShieldAlert className="size-5 text-slate-800" />}
      title="Solicitudes y Concesiones de Soporte Técnico"
      description={
        <>
          Auditoría y control institucional de accesos temporales desde{" "}
          <code className="font-mono">GET /api/tenant/support-access</code>.
        </>
      }
      headerAction={<RefreshButton onClick={onRefresh} loading={refreshing} />}
    >
      {grants.length === 0 ? (
        <EmptyState title="No existen solicitudes de acceso temporal de soporte registradas para este colegio." />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Motivo y Solicitante</TableHead>
              <TableHead>Permisos Solicitados</TableHead>
              <TableHead>Duración</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Vigencia / Fechas</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {grants.map((grant) => {
              const isBusy = busyGrantId === grant.id;
              return (
                <TableRow key={grant.id}>
                  <TableCell>
                    <div className="font-medium text-slate-900">{grant.reason}</div>
                    <div className="font-mono text-xs text-slate-500">
                      Solicitante: {grant.requestedByUserId}
                    </div>
                    <div className="font-mono text-[11px] text-slate-400">ID: {grant.id}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {grant.permissions.map((perm) => (
                        <Badge key={perm} variant="outline" className="font-mono text-[11px]">
                          {perm}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-slate-700">
                    {grant.durationMinutes} min
                  </TableCell>
                  <TableCell>
                    <SupportGrantStatusBadge status={grant.status} />
                  </TableCell>
                  <TableCell className="space-y-0.5 text-xs text-slate-600">
                    <div>
                      Solicitado:{" "}
                      {new Date(grant.requestedAt).toLocaleString("es-DO", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </div>
                    {grant.expiresAt ? (
                      <div className="font-medium text-amber-800">
                        Expira:{" "}
                        {new Date(grant.expiresAt).toLocaleString("es-DO", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                      </div>
                    ) : null}
                    {grant.revokedAt ? (
                      <div className="text-red-700">
                        Revocado:{" "}
                        {new Date(grant.revokedAt).toLocaleString("es-DO", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                      </div>
                    ) : null}
                  </TableCell>
                  <TableCell className="text-right">
                    {canManageSupportAccess && grant.status === "Requested" ? (
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          type="button"
                          variant="default"
                          size="sm"
                          disabled={isBusy}
                          onClick={() => onGrantAction(grant, "approve")}
                        >
                          <ShieldCheck className="size-4" />
                          Aprobar
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={isBusy}
                          onClick={() => onGrantAction(grant, "reject")}
                        >
                          <XCircle className="size-4 text-red-600" />
                          Rechazar
                        </Button>
                      </div>
                    ) : canManageSupportAccess && grant.status === "Approved" ? (
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        disabled={isBusy}
                        onClick={() => onGrantAction(grant, "revoke")}
                      >
                        <Ban className="size-4" />
                        Revocar acceso
                      </Button>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
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
