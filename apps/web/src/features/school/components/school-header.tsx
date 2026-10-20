import Link from "next/link";
import {
  Building2,
  ClipboardCheck,
  ContactRound,
  GraduationCap,
  ShieldAlert,
  ShieldCheck,
  Users,
} from "lucide-react";
import { LogoutButton } from "@/components/auth/logout-button";
import { AccessTypeBadge, InstitutionStatusBadge } from "@/components/shared/status-badge";
import { Badge } from "@/components/ui/badge";
import type { TenantContextDto } from "@/lib/api/types";

export type SchoolNavigationTab =
  "overview" | "academic" | "students" | "evaluations" | "members" | "support-access";

interface SchoolHeaderProps {
  context: TenantContextDto;
  rawHost: string;
  userName: string;
  userEmail: string;
  csrfToken: string;
  activeTab: SchoolNavigationTab;
}

const NAV_ITEMS: Array<{
  tab: SchoolNavigationTab;
  href: string;
  label: string;
  Icon: typeof ShieldCheck;
}> = [
  { tab: "overview", href: "/", label: "Contexto y Permisos", Icon: ShieldCheck },
  { tab: "academic", href: "/academic", label: "Estructura Académica", Icon: GraduationCap },
  { tab: "students", href: "/students", label: "Estudiantes y Matrículas", Icon: ContactRound },
  {
    tab: "evaluations",
    href: "/evaluations",
    label: "Asistencia y Evaluaciones",
    Icon: ClipboardCheck,
  },
  { tab: "members", href: "/members", label: "Miembros Institucionales", Icon: Users },
  { tab: "support-access", href: "/support-access", label: "Acceso de Soporte", Icon: ShieldAlert },
];

export function SchoolHeader({
  context,
  rawHost,
  userName,
  userEmail,
  csrfToken,
  activeTab,
}: SchoolHeaderProps) {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-slate-900 text-white">
            <Building2 className="size-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-base font-bold text-slate-900">{context.tenant.name}</h1>
              <Badge variant="outline" className="font-mono text-xs">
                {context.tenant.slug}
              </Badge>
              <InstitutionStatusBadge
                status={context.tenant.status}
                activeLabel="Institución Activa"
              />
              <AccessTypeBadge accessType={context.accessType} />
            </div>
            <p className="text-xs text-slate-500">
              Portal Institucional KNOROOMS · Host: <span className="font-mono">{rawHost}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-sm font-medium text-slate-900">{userName}</div>
            <div className="text-xs text-slate-500">{userEmail}</div>
          </div>
          <LogoutButton csrfToken={csrfToken} />
        </div>
      </div>

      <div className="border-t border-slate-100 bg-slate-50/60">
        <nav className="mx-auto flex max-w-6xl items-center gap-2 px-6 py-2">
          {NAV_ITEMS.map(({ tab, href, label, Icon }) => (
            <Link
              key={tab}
              href={href}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                activeTab === tab
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:bg-slate-200/70 hover:text-slate-900"
              }`}
            >
              <Icon className="size-3.5" />
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
