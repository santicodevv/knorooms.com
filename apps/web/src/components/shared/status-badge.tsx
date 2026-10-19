import { Badge } from "@/components/ui/badge";
import type {
  InstitutionStatus,
  MembershipStatus,
  SupportGrantStatus,
  TenantAccessType,
} from "@/lib/api/types";

export function InstitutionStatusBadge({
  status,
  activeLabel = "Activa",
  suspendedLabel = "Suspendida",
}: {
  status: InstitutionStatus;
  activeLabel?: string;
  suspendedLabel?: string;
}) {
  return status === "Active" ? (
    <Badge variant="success">{activeLabel}</Badge>
  ) : (
    <Badge variant="warning">{suspendedLabel}</Badge>
  );
}

export function MembershipStatusBadge({ status }: { status: MembershipStatus }) {
  return status === "Active" ? (
    <Badge variant="success">Activo</Badge>
  ) : (
    <Badge variant="outline">Revocado</Badge>
  );
}

export function SupportGrantStatusBadge({ status }: { status: SupportGrantStatus }) {
  switch (status) {
    case "Requested":
      return <Badge variant="warning">Pendiente de Aprobación</Badge>;
    case "Approved":
      return <Badge variant="success">Aprobado</Badge>;
    case "Rejected":
      return <Badge variant="outline">Rechazado</Badge>;
    case "Revoked":
      return <Badge variant="destructive">Revocado</Badge>;
  }
}

export function AccessTypeBadge({ accessType }: { accessType: TenantAccessType }) {
  return accessType === "Support" ? (
    <Badge variant="warning">Acceso Soporte</Badge>
  ) : (
    <Badge variant="secondary">Miembro Institucional</Badge>
  );
}
