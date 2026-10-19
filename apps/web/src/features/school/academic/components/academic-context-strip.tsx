import {
  BookOpen,
  CalendarRange,
  GraduationCap,
  Layers,
  Lock,
  Sparkles,
  UserCheck,
} from "lucide-react";
import { RefreshButton } from "@/components/shared/refresh-button";
import type { AcademicWorkspaceView } from "@/features/school/academic/hooks/use-academic-workspace";
import { calculateAcademicYearProgress } from "@/features/school/academic/schemas/academic-schemas";
import type { AcademicYearDto } from "@/lib/api/types";

interface AcademicContextStripProps {
  academicYears: AcademicYearDto[];
  activeAcademicYear: AcademicYearDto | null;
  selectedAcademicYearId: string;
  onSelectAcademicYear: (yearId: string) => void;
  activeView: AcademicWorkspaceView;
  onSelectView: (view: AcademicWorkspaceView) => void;
  gradesCount: number;
  sectionsCount: number;
  totalSeatCapacity: number;
  subjectsCount: number;
  assignmentsCount: number;
  totalWeeklyHours: number;
  isRefreshing: boolean;
  onRefresh: () => void;
}

const WORKSPACE_TABS: Array<{
  id: AcademicWorkspaceView;
  label: string;
  countKey: "sections" | "years" | "subjects" | "assignments";
  Icon: typeof Layers;
}> = [
  { id: "grades-sections", label: "Grados y Secciones", countKey: "sections", Icon: Layers },
  { id: "years", label: "Años Escolares", countKey: "years", Icon: CalendarRange },
  { id: "subjects", label: "Catálogo Curricular", countKey: "subjects", Icon: BookOpen },
  { id: "assignments", label: "Carga Docente", countKey: "assignments", Icon: UserCheck },
];

export function AcademicContextStrip({
  academicYears,
  activeAcademicYear,
  selectedAcademicYearId,
  onSelectAcademicYear,
  activeView,
  onSelectView,
  gradesCount,
  sectionsCount,
  totalSeatCapacity,
  subjectsCount,
  assignmentsCount,
  totalWeeklyHours,
  isRefreshing,
  onRefresh,
}: AcademicContextStripProps) {
  const yearProgress = activeAcademicYear
    ? calculateAcademicYearProgress(activeAcademicYear.startDate, activeAcademicYear.endDate)
    : 0;

  const counts = {
    sections: sectionsCount,
    years: academicYears.length,
    subjects: subjectsCount,
    assignments: assignmentsCount,
  };

  return (
    <section className="animate-fade-in-up overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      {/* Upper architectural bar: Active School Year & Timeline Progress */}
      <div className="flex flex-col justify-between gap-4 border-b border-slate-100 px-5 py-4 lg:flex-row lg:items-center">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg border border-slate-200 bg-slate-950 text-white shadow-xs">
            <GraduationCap className="size-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
                Arquitectura Académica MINERD
              </span>
              {activeAcademicYear ? (
                activeAcademicYear.isClosed ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                    <Lock className="size-2.5" />
                    Cerrado
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/80 bg-emerald-50/90 px-2 py-0.5 text-[11px] font-medium text-emerald-800">
                    <span className="size-1.5 rounded-full bg-emerald-500" />
                    Período Lectivo Activo
                  </span>
                )
              ) : null}
            </div>
            <h2 className="text-base font-semibold tracking-tight text-slate-900">
              {activeAcademicYear
                ? `${activeAcademicYear.name} (${activeAcademicYear.code})`
                : "Configuración Inicial de Estructura Escolar"}
            </h2>
          </div>
        </div>

        {/* Year Filter Selector + Timeline Progress Bar */}
        <div className="flex flex-wrap items-center gap-4">
          {activeAcademicYear ? (
            <div className="hidden min-w-[190px] flex-col gap-1 sm:flex">
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span className="font-mono">{activeAcademicYear.startDate}</span>
                <span className="font-mono font-medium text-slate-700 tabular-nums">
                  {yearProgress}%
                </span>
                <span className="font-mono">{activeAcademicYear.endDate}</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="animate-progress-grow h-full rounded-full bg-slate-900 transition-all duration-500"
                  style={{ width: `${Math.max(6, yearProgress)}%` }}
                />
              </div>
            </div>
          ) : null}

          <div className="flex items-center gap-2">
            <label htmlFor="academic-year-selector" className="text-xs font-medium text-slate-500">
              Año lectivo:
            </label>
            <select
              id="academic-year-selector"
              value={selectedAcademicYearId}
              onChange={(event) => onSelectAcademicYear(event.target.value)}
              className="h-8 rounded-lg border border-slate-200 bg-slate-50/80 px-2.5 text-xs font-medium text-slate-900 transition-colors hover:border-slate-300 focus:border-slate-900 focus:bg-white focus:outline-none"
            >
              <option value="all">Todos los años ({academicYears.length})</option>
              {academicYears.map((year) => (
                <option key={year.id} value={year.id}>
                  {year.code} — {year.isClosed ? "Cerrado" : "Activo"}
                </option>
              ))}
            </select>
            <RefreshButton loading={isRefreshing} onClick={onRefresh} label="Sincronizar" />
          </div>
        </div>
      </div>

      {/* High-density Telemetry Ribbon (tabular-nums) */}
      <div className="grid grid-cols-2 divide-x divide-y divide-slate-100 border-b border-slate-100 bg-slate-50/40 sm:grid-cols-5 sm:divide-y-0">
        <div className="px-4 py-2.5">
          <div className="text-[11px] font-medium text-slate-500">Grados Oficiales</div>
          <div className="mt-0.5 flex items-baseline gap-1.5">
            <span className="text-lg font-semibold tracking-tight text-slate-900 tabular-nums">
              {gradesCount}
            </span>
            <span className="text-[11px] text-slate-400">niveles</span>
          </div>
        </div>

        <div className="px-4 py-2.5">
          <div className="text-[11px] font-medium text-slate-500">Secciones Activas</div>
          <div className="mt-0.5 flex items-baseline gap-1.5">
            <span className="text-lg font-semibold tracking-tight text-slate-900 tabular-nums">
              {sectionsCount}
            </span>
            <span className="text-[11px] text-slate-400">aulas</span>
          </div>
        </div>

        <div className="px-4 py-2.5">
          <div className="text-[11px] font-medium text-slate-500">Capacidad Instalada</div>
          <div className="mt-0.5 flex items-baseline gap-1.5">
            <span className="text-lg font-semibold tracking-tight text-slate-900 tabular-nums">
              {totalSeatCapacity}
            </span>
            <span className="text-[11px] text-slate-400">cupos</span>
          </div>
        </div>

        <div className="px-4 py-2.5">
          <div className="text-[11px] font-medium text-slate-500">Catálogo Curricular</div>
          <div className="mt-0.5 flex items-baseline gap-1.5">
            <span className="text-lg font-semibold tracking-tight text-slate-900 tabular-nums">
              {subjectsCount}
            </span>
            <span className="text-[11px] text-slate-400">asignaturas</span>
          </div>
        </div>

        <div className="col-span-2 px-4 py-2.5 sm:col-span-1">
          <div className="text-[11px] font-medium text-slate-500">Carga Pedagógica</div>
          <div className="mt-0.5 flex items-baseline gap-1.5">
            <span className="text-lg font-semibold tracking-tight text-slate-900 tabular-nums">
              {totalWeeklyHours}h
            </span>
            <span className="text-[11px] text-slate-400">/ sem ({assignmentsCount} asig.)</span>
          </div>
        </div>
      </div>

      {/* Segmented Workspace Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-white px-4 py-2">
        <div
          role="tablist"
          aria-label="Vistas de estructura académica"
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
          <span>Aislamiento RLS activo por institución</span>
        </div>
      </div>
    </section>
  );
}
