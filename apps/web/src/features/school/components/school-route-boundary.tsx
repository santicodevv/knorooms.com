import { Suspense, type ReactNode } from "react";
import { RouteLoading } from "@/components/shared/route-loading";
export function SchoolRouteBoundary({ children }: { children: ReactNode }) {
  return <Suspense fallback={<RouteLoading />}>{children}</Suspense>;
}
