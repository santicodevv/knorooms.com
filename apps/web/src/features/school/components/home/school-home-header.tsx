import { ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { InstitutionStatus } from "@/lib/api/types";
import type { SchoolDashboardYear } from "../../schemas/school-dashboard-types";
export function SchoolHomeHeader({
  name,
  status,
  years,
  year,
  onYearChange,
}: {
  name: string;
  status: InstitutionStatus;
  years: readonly SchoolDashboardYear[];
  year: string;
  onYearChange: (year: string) => void;
}) {
  return (
    <header className="flex flex-wrap items-center gap-4">
      <div className="min-w-0 flex-1">
        <h1 className="text-school-page">Hola, {name.trim().split(/\s+/)[0]}</h1>
        <p className="text-school-secondary text-school-body mt-1.5">
          Esto es lo que sucede en tu colegio. Elige una tarea para continuar.
        </p>
      </div>
      <Badge
        variant={status === "Active" ? "success" : "warning"}
        className="school:gap-2 school:px-3 school:py-1.5 school:text-school-small"
      >
        <span aria-hidden="true" className="size-2 rounded-full bg-current" />
        {status === "Active" ? "Institución activa" : "Institución suspendida"}
      </Badge>
      <label className="border-school-border bg-school-surface rounded-school-control relative flex min-h-11 items-center gap-2.5 border-[1.5px] py-2 pr-9 pl-4">
        <span className="text-school-secondary text-school-small">Año escolar</span>
        <select
          aria-label="Año escolar del resumen"
          className="text-school-ink text-school-button min-w-0 appearance-none bg-transparent font-semibold focus-visible:outline-2 focus-visible:outline-offset-4"
          value={year}
          onChange={(event) => onYearChange(event.target.value)}
          disabled={!years.length}
        >
          {!years.length && <option value="">No disponible</option>}
          {years.map((item) => (
            <option key={item.id} value={item.id}>
              {item.code}
            </option>
          ))}
        </select>
        <ChevronDown
          aria-hidden="true"
          className="text-school-secondary pointer-events-none absolute right-4 size-4"
        />
      </label>
    </header>
  );
}
