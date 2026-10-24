"use client";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProblemAlert } from "@/components/api/problem-alert";
import { PlatformPageHeading } from "../platform-page-heading";
import { usePlatformDashboard } from "../../hooks/use-platform-dashboard";
import { DashboardStatCards } from "./dashboard-stat-cards";
import { DashboardCharts } from "./dashboard-charts";
import { DashboardActions } from "./dashboard-actions";
import { DashboardRecent } from "./dashboard-recent";
import type { PlatformDashboardData } from "../../schemas/dashboard-schemas";
import type { ProblemDetails } from "@/lib/api/types";
export function PlatformDashboard({
  initial,
  problem,
}: {
  initial: PlatformDashboardData | null;
  problem: ProblemDetails | null;
}) {
  const s = usePlatformDashboard(initial, problem);
  return (
    <>
      <PlatformPageHeading
        title="Dashboard"
        description="Una visión general de las instituciones y la actividad administrativa de KNOROOMS."
        action={
          <Button variant="outline" disabled={s.busy} onClick={s.refresh}>
            <RefreshCw className={s.busy ? "animate-spin" : ""} />
            Actualizar
          </Button>
        }
      />
      {s.problem ? (
        <div className="mb-4">
          <ProblemAlert problem={s.problem} />
        </div>
      ) : null}
      {s.data ? (
        <>
          <DashboardStatCards data={s.data} />
          <DashboardCharts data={s.data} chart={s.chart} period={s.period} onPeriod={s.setPeriod} />
          <DashboardActions data={s.data} />
          <DashboardRecent data={s.data} />
        </>
      ) : null}
    </>
  );
}
