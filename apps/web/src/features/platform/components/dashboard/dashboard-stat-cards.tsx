import Link from "next/link";
import { ArrowUpRight, Building2, CheckCircle2, PauseCircle, UserX } from "lucide-react";
import type { PlatformDashboardData } from "../../schemas/dashboard-schemas";
export function DashboardStatCards({ data }: { data: PlatformDashboardData }) {
  const stats = [
    {
      label: "Instituciones registradas",
      value: data.total,
      note: "Total de colegios registrados",
      icon: Building2,
      tone: "bg-blue-50 text-blue-600",
      href: "/institutions",
    },
    {
      label: "Instituciones activas",
      value: data.active,
      note: "Disponibles en la plataforma",
      icon: CheckCircle2,
      tone: "bg-emerald-50 text-emerald-600",
      href: "/institutions?status=Active",
    },
    {
      label: "Instituciones suspendidas",
      value: data.suspended,
      note: "Acceso institucional restringido",
      icon: PauseCircle,
      tone: "bg-orange-50 text-orange-500",
      href: "/institutions?status=Suspended",
    },
    {
      label: "Sin administrador activo",
      value: data.withoutActiveAdministrator,
      note: "Sin asignar o activación pendiente",
      icon: UserX,
      tone: "bg-violet-50 text-violet-500",
      href: "/institutions?administrator=NotActive",
    },
  ];
  return (
    <section
      aria-label="Resumen de instituciones"
      className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4"
    >
      {stats.map(({ label, value, note, icon: Icon, tone, href }) => (
        <Link
          key={label}
          href={href}
          className="border-divider min-w-0 rounded-[13px] border bg-white p-4 shadow-[0_2px_16px_rgba(20,43,89,0.035)] transition-colors hover:border-blue-200 sm:p-5"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-slate-500">{label}</p>
              <p className="mt-3 text-[28px] font-bold tracking-tight text-slate-900 tabular-nums">
                {value}
              </p>
            </div>
            <span
              className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${tone}`}
            >
              <Icon className="size-[19px]" />
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between gap-2">
            <p className="text-muted text-[11px] leading-4">{note}</p>
            <ArrowUpRight className="size-3.5 shrink-0 text-slate-300" />
          </div>
        </Link>
      ))}
    </section>
  );
}
