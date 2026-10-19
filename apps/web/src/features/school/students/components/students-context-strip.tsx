import { ClipboardCheck, ContactRound, HeartHandshake, Sparkles, Users } from "lucide-react";
import { RefreshButton } from "@/components/shared/refresh-button";
import type { StudentsWorkspaceView } from "@/features/school/students/hooks/use-students-workspace";
import { calculateSectionOccupancyPercent } from "@/features/school/students/schemas/students-schemas";

interface StudentsContextStripProps {
  activeView: StudentsWorkspaceView;
  onSelectView: (view: StudentsWorkspaceView) => void;
  totalStudents: number;
  activeStudents: number;
  sigerdCount: number;
  guardiansCount: number;
  activeEnrollments: number;
  totalCapacity: number;
  totalAvailableSeats: number;
  isRefreshing: boolean;
  onRefresh: () => void;
}

const WORKSPACE_TABS: Array<{
  id: StudentsWorkspaceView;
  label: string;
  countKey: "students" | "enrollments" | "guardians";
  Icon: typeof Users;
}> = [
  { id: "directory", label: "Expedientes 360°", countKey: "students", Icon: ContactRound },
  {
    id: "enrollments",
    label: "Matrículas y Cupos por Aula",
    countKey: "enrollments",
    Icon: ClipboardCheck,
  },
  {
    id: "guardians",
    label: "Tutores y Núcleo Familiar",
    countKey: "guardians",
    Icon: HeartHandshake,
  },
];

export function StudentsContextStrip({
  activeView,
  onSelectView,
  totalStudents,
  activeStudents,
  sigerdCount,
  guardiansCount,
  activeEnrollments,
  totalCapacity,
  totalAvailableSeats,
  isRefreshing,
  onRefresh,
}: StudentsContextStripProps) {
  const occupancyPercent = calculateSectionOccupancyPercent(activeEnrollments, totalCapacity);

  const counts = {
    students: totalStudents,
    enrollments: activeEnrollments,
    guardians: guardiansCount,
  };

  return (
    <section className="animate-fade-in-up overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      {/* Upper architectural bar */}
      <div className="flex flex-col justify-between gap-4 border-b border-slate-100 px-5 py-4 lg:flex-row lg:items-center">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg border border-slate-200 bg-slate-950 text-white shadow-xs">
            <Users className="size-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
                Registro y Control Académico · SIGERD
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/80 bg-emerald-50/90 px-2 py-0.5 text-[11px] font-medium text-emerald-800">
                <span className="size-1.5 rounded-full bg-emerald-500" />
                Control de Cupos en Vivo
              </span>
            </div>
            <h2 className="text-base font-semibold tracking-tight text-slate-900">
              Expedientes Estudiantiles Permanentes, Tutores y Matrícula Anual
            </h2>
          </div>
        </div>

        {/* Live Classroom Occupancy Bar + Refresh */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="hidden min-w-[200px] flex-col gap-1 sm:flex">
            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span>Ocupación global de aulas</span>
              <span className="font-mono font-semibold text-slate-800 tabular-nums">
                {activeEnrollments} / {totalCapacity} ({occupancyPercent}%)
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className={`animate-progress-grow h-full rounded-full transition-all duration-500 ${
                  occupancyPercent >= 95
                    ? "bg-rose-600"
                    : occupancyPercent >= 80
                      ? "bg-amber-500"
                      : "bg-slate-900"
                }`}
                style={{ width: `${Math.max(4, occupancyPercent)}%` }}
              />
            </div>
          </div>

          <RefreshButton loading={isRefreshing} onClick={onRefresh} label="Sincronizar" />
        </div>
      </div>

      {/* High-density Telemetry Ribbon (tabular-nums) */}
      <div className="grid grid-cols-2 divide-x divide-y divide-slate-100 border-b border-slate-100 bg-slate-50/40 sm:grid-cols-5 sm:divide-y-0">
        <div className="px-4 py-2.5">
          <div className="text-[11px] font-medium text-slate-500">Expedientes Activos</div>
          <div className="mt-0.5 flex items-baseline gap-1.5">
            <span className="text-lg font-semibold tracking-tight text-slate-900 tabular-nums">
              {activeStudents}
            </span>
            <span className="text-[11px] text-slate-400">de {totalStudents}</span>
          </div>
        </div>

        <div className="px-4 py-2.5">
          <div className="text-[11px] font-medium text-slate-500">Matrículas Vigentes</div>
          <div className="mt-0.5 flex items-baseline gap-1.5">
            <span className="text-lg font-semibold tracking-tight text-slate-900 tabular-nums">
              {activeEnrollments}
            </span>
            <span className="text-[11px] text-slate-400">inscritos</span>
          </div>
        </div>

        <div className="px-4 py-2.5">
          <div className="text-[11px] font-medium text-slate-500">Cupos Disponibles</div>
          <div className="mt-0.5 flex items-baseline gap-1.5">
            <span className="text-lg font-semibold tracking-tight text-emerald-700 tabular-nums">
              {totalAvailableSeats}
            </span>
            <span className="text-[11px] text-slate-400">de {totalCapacity}</span>
          </div>
        </div>

        <div className="px-4 py-2.5">
          <div className="text-[11px] font-medium text-slate-500">Tutores Familiares</div>
          <div className="mt-0.5 flex items-baseline gap-1.5">
            <span className="text-lg font-semibold tracking-tight text-slate-900 tabular-nums">
              {guardiansCount}
            </span>
            <span className="text-[11px] text-slate-400">registrados</span>
          </div>
        </div>

        <div className="col-span-2 px-4 py-2.5 sm:col-span-1">
          <div className="text-[11px] font-medium text-slate-500">Identificación SIGERD</div>
          <div className="mt-0.5 flex items-baseline gap-1.5">
            <span className="text-lg font-semibold tracking-tight text-slate-900 tabular-nums">
              {sigerdCount}
            </span>
            <span className="text-[11px] text-slate-400">vinculados MINERD</span>
          </div>
        </div>
      </div>

      {/* Segmented Workspace Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-white px-4 py-2">
        <div
          role="tablist"
          aria-label="Vistas de expedientes y matrículas"
          className="inline-flex flex-wrap items-center gap-1 rounded-lg bg-slate-100/80 p-1"
        >
          {WORKSPACE_TABS.map(({ id, label, countKey, Icon }) => {
            const isActive = activeView === id;
            return (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => onSelectView(id)}
                className={`inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium transition-all duration-150 ${
                  isActive
                    ? "bg-white text-slate-950 shadow-xs ring-1 ring-slate-200/80"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Icon className={`size-3.5 ${isActive ? "text-slate-900" : "text-slate-400"}`} />
                <span>{label}</span>
                <span
                  className={`py-0.2 rounded-full px-1.5 font-mono text-[10px] tabular-nums ${
                    isActive ? "bg-slate-900 text-white" : "bg-slate-200/70 text-slate-600"
                  }`}
                >
                  {counts[countKey]}
                </span>
              </button>
            );
          })}
        </div>

        <div className="hidden items-center gap-1.5 text-[11px] text-slate-400 md:flex">
          <Sparkles className="size-3 text-slate-400" />
          <span>Expediente único permanente · Matrícula anual por sección</span>
        </div>
      </div>
    </section>
  );
}
