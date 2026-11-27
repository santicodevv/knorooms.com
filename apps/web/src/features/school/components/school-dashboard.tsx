"use client";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { ProblemAlert } from "@/components/api/problem-alert";
import { cn } from "@/lib/utils";
import { useSchoolDashboard, type SchoolDashboardData } from "../hooks/use-school-dashboard";
import { SchoolHomeHeader } from "./home/school-home-header";
import { SchoolHomeActions } from "./home/school-home-actions";
import { SchoolHomeMetrics } from "./home/school-home-metrics";
import { SchoolHomeChart } from "./home/school-home-chart";
import { SchoolHomeSections } from "./home/school-home-sections";
import { SchoolHomeReview } from "./home/school-home-review";
import styles from "./home/school-home.module.css";
export function SchoolDashboard({
  data,
  commercialStatus,
}: {
  data: SchoolDashboardData;
  commercialStatus?: ReactNode;
}) {
  const state = useSchoolDashboard(data);
  const canReadEnrollments =
    state.hasPermission("institution.enrollments.read") && state.canRead("enrollments");
  const readableModules =
    data.capabilities?.modules.filter((item) => item.canRead).map((item) => item.code) ?? [];
  return (
    <div className={styles.dashboard} aria-busy={state.refreshing}>
      <SchoolHomeHeader
        name={data.name}
        status={data.institutionStatus}
        years={data.academic?.academicYears ?? []}
        year={state.year}
        onYearChange={state.setYear}
      />
      {commercialStatus}
      {data.problems.length > 0 && (
        <div className="space-y-3">
          {data.problems.map(({ source, problem }) => (
            <ProblemAlert key={source} problem={problem} />
          ))}
          <Button variant="outline" onClick={state.refresh} disabled={state.refreshing}>
            {state.refreshing ? "Actualizando…" : "Reintentar"}
          </Button>
        </div>
      )}
      {data.capabilities && (
        <>
          <SchoolHomeActions permissions={data.permissions} readableModules={readableModules} />
          <SchoolHomeMetrics
            students={state.activeStudentsCount}
            enrollments={state.activeEnrollmentsCount}
            sections={state.enabledSectionsCount}
            seats={state.availableSeatsCount}
            yearCode={state.yearData?.code}
          />
          <div className={cn(styles.lower, state.hasEnrollments && styles.withData)}>
            <SchoolHomeChart
              chart={state.chart}
              available={state.enrollmentSummaryAvailable}
              noYear={data.academic !== null && data.academic.academicYears.length === 0}
              allowed={canReadEnrollments}
              canEnroll={state.canEnroll}
              canOrganize={state.canOrganize}
            />
            <div className={cn("flex min-w-0 flex-col gap-4", !state.hasEnrollments && "h-full")}>
              <SchoolHomeSections
                sections={state.sections}
                available={state.enrollmentSummaryAvailable}
                hasData={state.hasEnrollments}
                allowed={canReadEnrollments}
              />
              {state.hasEnrollments && (
                <SchoolHomeReview
                  unassigned={state.unassigned.length}
                  atCapacity={state.atCapacityCount}
                  canReviewStudents={state.canReviewStudents}
                />
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
