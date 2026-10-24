import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { PlatformPanel } from "../platform-panel";
import type { GrowthChartModel, PlatformDashboardData } from "../../schemas/dashboard-schemas";
export function DashboardCharts({
  data,
  chart,
  period,
  onPeriod,
}: {
  data: PlatformDashboardData;
  chart: GrowthChartModel;
  period: number;
  onPeriod: (value: number) => void;
}) {
  return (
    <section className="mb-4 grid gap-4 lg:grid-cols-[1.5fr_1fr]">
      <PlatformPanel
        title="Crecimiento de instituciones"
        description="Evolución acumulada de colegios registrados"
        action={
          <select
            aria-label="Período del gráfico"
            value={period}
            onChange={(e) => onPeriod(Number(e.target.value))}
            className="border-control h-8 rounded-lg border bg-white px-2 text-[11px] text-slate-500"
          >
            <option value={6}>Últimos 6 meses</option>
            <option value={12}>Últimos 12 meses</option>
          </select>
        }
      >
        <svg
          viewBox="0 0 630 215"
          className="h-[225px] w-full"
          role="img"
          aria-label="Evolución acumulada de instituciones"
        >
          <title>Colegios registrados por mes</title>
          <defs>
            <linearGradient id="growth-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#155DFC" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#155DFC" stopOpacity="0" />
            </linearGradient>
          </defs>
          {chart.ticks.map((t) => (
            <g key={t.value}>
              <line x1="42" x2="608" y1={t.y} y2={t.y} stroke="#eef1f7" />
              <text x="25" y={t.y + 4} textAnchor="end" fill="#475569" fontSize="11">
                {t.value}
              </text>
            </g>
          ))}
          <path d={chart.area} fill="url(#growth-fill)" />
          <path
            d={chart.line}
            stroke="#155DFC"
            strokeWidth="2.5"
            fill="none"
            strokeLinejoin="round"
          />
          {chart.points.map((p) => (
            <g key={`${p.year}-${p.month}`}>
              <circle cx={p.x} cy={p.y} r="3.5" stroke="#155DFC" strokeWidth="2" fill="white">
                <title>
                  {p.label} {p.year}: {p.total} instituciones
                </title>
              </circle>
              <text x={p.x} y="205" textAnchor="middle" fill="#475569" fontSize="11">
                {p.label}
              </text>
            </g>
          ))}
        </svg>
        <div className="flex items-center gap-2 text-[11px] text-slate-500">
          <span className="size-1.5 rounded-full bg-blue-600" />
          Instituciones registradas
        </div>
      </PlatformPanel>
      <PlatformPanel
        title="Módulos más habilitados"
        description="Instituciones que tienen cada módulo activo"
        action={
          <Link
            href="/institutions"
            aria-label="Administrar módulos por institución"
            className="text-muted hover:text-blue-600"
          >
            <ArrowUpRight className="size-4" />
          </Link>
        }
      >
        <div className="space-y-5 pt-2">
          {data.modules.map((m) => (
            <div
              key={m.code}
              className="grid grid-cols-[minmax(0,130px)_1fr_24px] items-center gap-3"
            >
              <span className="truncate text-[11px] font-medium text-slate-500" title={m.name}>
                {m.name}
              </span>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-300 to-blue-600"
                  style={{ width: `${data.total ? (m.count / data.total) * 100 : 0}%` }}
                />
              </div>
              <span className="text-right text-[11px] font-semibold text-slate-500">{m.count}</span>
            </div>
          ))}
        </div>
        <div className="text-muted mt-7 flex justify-between gap-2 text-[11px]">
          <span>Integración Moodle: Próximamente</span>
          <span>{data.total} colegios</span>
        </div>
      </PlatformPanel>
    </section>
  );
}
