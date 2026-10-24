import Link from "next/link";
import { Activity, Building2, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PlatformPanel } from "../platform-panel";
import {
  activityLabels,
  dashboardDate,
  type PlatformDashboardData,
} from "../../schemas/dashboard-schemas";
export function DashboardRecent({ data }: { data: PlatformDashboardData }) {
  return (
    <section className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
      <PlatformPanel
        title="Actividad reciente"
        description="Últimas acciones administrativas registradas"
      >
        <div className="divide-y divide-slate-100">
          {data.activity.length ? (
            data.activity.map((a) => (
              <div key={a.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <span className="rounded-lg bg-blue-50 p-2 text-blue-600">
                  <Activity className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold">
                    {activityLabels[a.action] ?? "Actividad administrativa"}
                  </p>
                  <p className="text-muted mt-1 truncate text-[11px]">{a.institutionName}</p>
                </div>
                <time dateTime={a.createdAt} className="text-muted shrink-0 text-[11px]">
                  {dashboardDate(a.createdAt)}
                </time>
              </div>
            ))
          ) : (
            <p className="text-muted py-8 text-center text-xs">
              Todavía no hay actividad administrativa registrada.
            </p>
          )}
        </div>
      </PlatformPanel>
      <PlatformPanel
        title="Instituciones recientes"
        description="Colegios incorporados recientemente"
        action={
          <Link
            href="/institutions"
            className="flex items-center gap-1 text-[11px] font-semibold text-blue-600"
          >
            Ver todas
            <ArrowRight className="size-3" />
          </Link>
        }
      >
        <div className="divide-y divide-slate-100">
          {data.recentInstitutions.length ? (
            data.recentInstitutions.map((i) => (
              <Link
                key={i.id}
                href={`/institutions/${i.id}`}
                className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
              >
                <span className="rounded-lg bg-blue-50 p-2 text-blue-600">
                  <Building2 className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[11px] font-semibold">{i.name}</p>
                  <p className="text-muted mt-1 truncate text-[11px]">
                    {i.slug} · {dashboardDate(i.createdAt)}
                  </p>
                </div>
                <Badge variant={i.status === "Active" ? "success" : "destructive"}>
                  {i.status === "Active" ? "Activa" : "Suspendida"}
                </Badge>
              </Link>
            ))
          ) : (
            <p className="text-muted py-8 text-center text-xs">
              Las nuevas instituciones aparecerán aquí.
            </p>
          )}
        </div>
      </PlatformPanel>
    </section>
  );
}
