import Link from "next/link";
import {
  ArrowRight,
  ChevronRight,
  Clock3,
  MailX,
  UserX,
  Plus,
  Building2,
  UserPlus,
  Layers3,
} from "lucide-react";
import { PlatformPanel } from "../platform-panel";
import type { PlatformDashboardData } from "../../schemas/dashboard-schemas";
export function DashboardActions({ data }: { data: PlatformDashboardData }) {
  const attention = [
    {
      label: "Colegios sin administrador",
      description: "Instituciones que aún necesitan administrador.",
      value: data.withoutAdministrator,
      state: "None",
      icon: UserX,
      tone: "bg-orange-50 text-orange-400",
    },
    {
      label: "Invitaciones vencidas",
      description: "Invitaciones con enlaces expirados.",
      value: data.expiredInvitations,
      state: "Expired",
      icon: Clock3,
      tone: "bg-orange-50 text-orange-400",
    },
    {
      label: "Envíos fallidos",
      description: "Invitaciones que no pudieron enviarse.",
      value: data.failedInvitations,
      state: "Failed",
      icon: MailX,
      tone: "bg-red-50 text-red-700",
    },
  ];
  const shortcuts = [
    {
      label: "Nueva institución",
      description: "Registrar un colegio",
      icon: Plus,
      href: "/institutions/new",
    },
    {
      label: "Ver instituciones",
      description: "Consultar y gestionar",
      icon: Building2,
      href: "/institutions",
    },
    {
      label: "Invitar administrador",
      description: "Colegios sin activar",
      icon: UserPlus,
      href: "/institutions?administrator=NotActive",
    },
    {
      label: "Administrar módulos",
      description: "Configurar por colegio",
      icon: Layers3,
      href: "/institutions",
    },
  ];
  return (
    <section className="mb-4 grid gap-4 lg:grid-cols-[1.1fr_1fr]">
      <PlatformPanel
        title="Requieren atención"
        description="Situaciones que necesitan seguimiento del operador"
        action={
          <Link
            href="/institutions?administrator=NotActive"
            className="flex items-center gap-1 text-[11px] font-semibold text-blue-600"
          >
            Ver todas
            <ArrowRight className="size-3" />
          </Link>
        }
      >
        <div className="divide-y divide-slate-100">
          {attention.map(({ label, description, value, state, icon: Icon, tone }) => (
            <Link
              key={state}
              href={`/institutions?administrator=${state}`}
              className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
            >
              <span
                className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${tone}`}
              >
                <Icon className="size-[17px]" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-xs font-semibold text-slate-700">{label}</span>
                <span className="text-muted mt-1 block text-[11px]">{description}</span>
              </span>
              <span className="rounded-lg bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-500">
                {value}
              </span>
              <ChevronRight className="size-3 text-slate-300" />
            </Link>
          ))}
        </div>
      </PlatformPanel>
      <PlatformPanel
        title="Accesos rápidos"
        description="Acciones más utilizadas por el administrador global"
      >
        <div className="grid gap-3 sm:grid-cols-2">
          {shortcuts.map(({ label, description, icon: Icon, href }) => (
            <Link
              key={label}
              href={href}
              className="border-divider flex items-center gap-3 rounded-xl border p-3.5 transition-colors hover:border-blue-200 hover:bg-blue-50/30"
            >
              <span className="rounded-lg bg-blue-50 p-2.5 text-blue-600">
                <Icon className="size-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[11px] font-semibold">{label}</span>
                <span className="text-muted mt-1 block text-[11px]">{description}</span>
              </span>
              <ArrowRight className="size-3 shrink-0 text-slate-300" />
            </Link>
          ))}
        </div>
      </PlatformPanel>
    </section>
  );
}
