import { SchoolPanel, SchoolField, schoolSelectClass } from "../../components/school-ui";
import { Input } from "@/components/ui/input";
import type { EvaluationsState } from "../hooks/use-evaluations-workspace";
import { EVALUATION_PERIOD_OPTIONS } from "../schemas/evaluations-schemas";
export function EvaluationFilters({ state: s, area }: { state: EvaluationsState; area: string }) {
  return (
    <SchoolPanel className="mb-5">
      <div className="flex flex-wrap items-end gap-4 p-5">
        <div className="min-w-40 flex-1">
          <SchoolField label="Año escolar">
            <select
              className={schoolSelectClass}
              disabled={s.isLoadingFilters}
              value={s.selectedAcademicYearId}
              onChange={(e) => void s.handleAcademicYearChange(e.target.value)}
            >
              <option value="">Seleccionar año</option>
              {s.academicYears.map((y) => (
                <option key={y.id} value={y.id}>
                  {y.code}
                </option>
              ))}
            </select>
          </SchoolField>
        </div>
        {area !== "settings" && (
          <div className="min-w-48 flex-1">
            <SchoolField label="Sección">
              <select
                className={schoolSelectClass}
                disabled={s.isLoadingFilters}
                value={s.selectedSectionId}
                onChange={(e) => void s.handleSectionChange(e.target.value)}
              >
                <option value="">Seleccionar sección</option>
                {s.availableSections.map((sec) => (
                  <option key={sec.id} value={sec.id}>
                    {sec.gradeLevelName} {sec.code}
                  </option>
                ))}
              </select>
            </SchoolField>
          </div>
        )}
        {area === "grading" && (
          <div className="min-w-48 flex-1">
            <SchoolField label="Materia">
              <select
                className={schoolSelectClass}
                disabled={s.isLoadingFilters}
                value={s.selectedSubjectId}
                onChange={(e) => void s.handleSubjectChange(e.target.value)}
              >
                <option value="">Seleccionar materia</option>
                {s.subjects.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name}
                  </option>
                ))}
              </select>
            </SchoolField>
          </div>
        )}
        {area === "attendance" ? (
          <div className="min-w-40 flex-1">
            <SchoolField label="Fecha">
              <Input
                type="date"
                disabled={s.isLoadingFilters}
                value={s.selectedDate}
                onChange={(e) => void s.handleDateChange(e.target.value)}
              />
            </SchoolField>
          </div>
        ) : (
          area !== "settings" && (
            <div className="min-w-36 flex-1">
              <SchoolField label="Período">
                <select
                  className={schoolSelectClass}
                  disabled={s.isLoadingFilters}
                  value={s.selectedPeriodCode}
                  onChange={(e) => void s.handlePeriodChange(e.target.value)}
                >
                  {EVALUATION_PERIOD_OPTIONS.map((p) => (
                    <option key={p.code} value={p.code}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </SchoolField>
            </div>
          )
        )}
      </div>
    </SchoolPanel>
  );
}
