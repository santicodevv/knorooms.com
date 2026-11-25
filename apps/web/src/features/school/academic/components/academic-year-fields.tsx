import { Input } from "@/components/ui/input";
import { SchoolFormField } from "../../components/school-form-field";
import { AcademicIcon } from "./academic-icon";
import type { AcademicState } from "../hooks/use-academic-workspace";
import styles from "./academic.module.css";
export function AcademicYearFields({ state: s }: { state: AcademicState }) {
  const f = s.yearForm,
    e = f.formState.errors;
  return (
    <>
      <SchoolFormField id="academic-year-code" label="Código *" error={e.code?.message}>
        <Input
          id="academic-year-code"
          placeholder="2026-2027"
          disabled={s.isPending}
          aria-invalid={!!e.code}
          aria-describedby={e.code ? "academic-year-code-error" : undefined}
          {...f.register("code")}
        />
      </SchoolFormField>
      <SchoolFormField id="academic-year-name" label="Nombre *" error={e.name?.message}>
        <Input
          id="academic-year-name"
          placeholder="Año escolar 2026-2027"
          disabled={s.isPending}
          aria-invalid={!!e.name}
          aria-describedby={e.name ? "academic-year-name-error" : undefined}
          {...f.register("name")}
        />
      </SchoolFormField>
      <div className={styles.fieldGrid}>
        {(["startDate", "endDate"] as const).map((name, index) => {
          const id = "academic-year-" + name;
          return (
            <SchoolFormField
              key={name}
              id={id}
              label={index ? "Fecha de cierre *" : "Fecha de inicio *"}
              error={e[name]?.message}
            >
              <div className={styles.fieldDate}>
                <Input
                  id={id}
                  type="date"
                  disabled={s.isPending}
                  aria-invalid={!!e[name]}
                  aria-describedby={e[name] ? id + "-error" : undefined}
                  {...f.register(name)}
                />
                <span>
                  <AcademicIcon name="calendar" />
                </span>
              </div>
            </SchoolFormField>
          );
        })}
      </div>
    </>
  );
}
