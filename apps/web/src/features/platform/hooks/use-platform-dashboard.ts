"use client";
import { useState } from "react";
import toast from "react-hot-toast";
import { getPlatformDashboard } from "../api/dashboard-api";
import { buildGrowthChart, type PlatformDashboardData } from "../schemas/dashboard-schemas";
import type { ProblemDetails } from "@/lib/api/types";
export function usePlatformDashboard(
  initial: PlatformDashboardData | null,
  initialProblem: ProblemDetails | null,
) {
  const [data, setData] = useState(initial);
  const [problem, setProblem] = useState(initialProblem);
  const [period, setPeriod] = useState(6);
  const [busy, setBusy] = useState(false);
  async function refresh() {
    setBusy(true);
    try {
      const result = await getPlatformDashboard();
      if (result.ok) {
        setData(result.data);
        setProblem(null);
        toast.success("Dashboard actualizado.");
      } else {
        setProblem(result.problem);
        toast.error("No se pudo actualizar el dashboard.");
      }
    } finally {
      setBusy(false);
    }
  }
  return {
    data,
    problem,
    period,
    setPeriod,
    busy,
    refresh,
    chart: buildGrowthChart(data?.growth ?? [], period),
  };
}
