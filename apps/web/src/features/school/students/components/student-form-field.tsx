import type { ReactNode } from "react";
import { FormFieldError } from "@/components/shared/form-field-error";
import styles from "./students.module.css";
export function StudentFormField({
  id,
  label,
  error,
  hint,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className={styles.field}>
      <label htmlFor={id}>{label}</label>
      {children}
      {hint && (
        <p id={id + "-hint"} className="text-school-label text-school-secondary">
          {hint}
        </p>
      )}
      <FormFieldError id={id + "-error"} message={error} />
    </div>
  );
}
