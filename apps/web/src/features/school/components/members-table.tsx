import { UserMinus, Users } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { RefreshButton } from "@/components/shared/refresh-button";
import { SectionCard } from "@/components/shared/section-card";
import { MembershipStatusBadge } from "@/components/shared/status-badge";
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
import type { MemberDto } from "@/lib/api/types";

interface MembersTableProps {
  members: MemberDto[];
  refreshing: boolean;
  busyMembershipId: string | null;
  canManageMembers: boolean;
  onRefresh: () => void;
  onRevokeMember: (member: MemberDto) => void;
}

export function MembersTable({
  members,
  refreshing,
  busyMembershipId,
  canManageMembers,
  onRefresh,
  onRevokeMember,
}: MembersTableProps) {
  return (
    <SectionCard
      icon={<Users className="size-5 text-slate-800" />}
      title="Miembros Institucionales"
      description={
        <>
          Usuarios vinculados al colegio desde{" "}
          <code className="font-mono">GET /api/tenant/members</code>.
        </>
      }
      headerAction={<RefreshButton onClick={onRefresh} loading={refreshing} />}
    >
      {members.length === 0 ? (
        <EmptyState title="No se encontraron miembros registrados en esta institución." />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Correo Electrónico</TableHead>
              <TableHead>Roles</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Fecha de Alta</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map((member) => {
              const isBusy = busyMembershipId === member.membershipId;
              return (
                <TableRow key={member.membershipId}>
                  <TableCell>
                    <div className="font-medium text-slate-900">{member.displayName}</div>
                    <div className="font-mono text-xs text-slate-400">{member.membershipId}</div>
                  </TableCell>
                  <TableCell className="text-slate-700">{member.email}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {member.roles.map((role) => (
                        <Badge key={role} variant="secondary">
                          {role}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <MembershipStatusBadge status={member.status} />
                  </TableCell>
                  <TableCell className="text-xs text-slate-600">
                    {new Date(member.createdAt).toLocaleString("es-DO", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </TableCell>
                  <TableCell className="text-right">
                    {member.status === "Active" && canManageMembers ? (
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        disabled={isBusy}
                        onClick={() => onRevokeMember(member)}
                      >
                        <UserMinus className="size-4" />
                        {isBusy ? "Revocando..." : "Revocar"}
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
