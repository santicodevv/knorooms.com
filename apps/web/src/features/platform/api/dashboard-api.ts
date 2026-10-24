import { bffFetch } from "@/lib/api/bff-client";
import type { PlatformDashboardData } from "../schemas/dashboard-schemas";
export const getPlatformDashboard = () =>
  bffFetch<PlatformDashboardData>("platform/institution-management/dashboard");
