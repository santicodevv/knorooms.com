export interface PlatformDashboardData {
  total: number;
  active: number;
  suspended: number;
  withoutActiveAdministrator: number;
  withoutAdministrator: number;
  pendingInvitations: number;
  expiredInvitations: number;
  failedInvitations: number;
  growth: { year: number; month: number; total: number }[];
  modules: { code: string; name: string; count: number }[];
  recentInstitutions: {
    id: string;
    name: string;
    slug: string;
    status: string;
    createdAt: string;
  }[];
  activity: {
    id: string;
    institutionId: string | null;
    institutionName: string;
    action: string;
    createdAt: string;
  }[];
  generatedAt: string;
}
export const activityLabels: Record<string, string> = {
  "platform.institution.created": "Institución creada",
  "platform.institution.suspended": "Institución suspendida",
  "platform.institution.activated": "Institución reactivada",
  "platform.institution.admin_assigned": "Administrador asignado",
  "platform.institution.profile_updated": "Información actualizada",
  "institution.modules.updated": "Módulos actualizados",
  "platform.invitation.created": "Invitación enviada",
  "platform.invitation.resent": "Invitación reenviada",
  "platform.invitation.revoked": "Invitación revocada",
  "platform.invitation.accepted": "Administrador activado",
};
export const dashboardDate = (value: string) =>
  new Intl.DateTimeFormat("es-DO", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "America/Santo_Domingo",
  }).format(new Date(value));
export function buildGrowthChart(growth: PlatformDashboardData["growth"], period: number) {
  const entries = growth.slice(-period);
  const ceiling = Math.max(4, Math.ceil(Math.max(...entries.map((x) => x.total), 0) / 4) * 4);
  const points = entries.map((entry, index) => ({
    ...entry,
    x: 42 + (index / Math.max(1, entries.length - 1)) * 566,
    y: 180 - (entry.total / ceiling) * 152,
    label: new Intl.DateTimeFormat("es-DO", { month: "short", timeZone: "UTC" }).format(
      new Date(Date.UTC(entry.year, entry.month - 1, 1)),
    ),
  }));
  return {
    points,
    line: points.map((p, i) => `${i ? "L" : "M"}${p.x},${p.y}`).join(" "),
    area: points.length
      ? `M42,180 ${points.map((p) => `L${p.x},${p.y}`).join(" ")} L608,180 Z`
      : "",
    ticks: Array.from({ length: 5 }, (_, i) => ({
      value: ceiling - (i * ceiling) / 4,
      y: 28 + i * 38,
    })),
  };
}
export type GrowthChartModel = ReturnType<typeof buildGrowthChart>;
