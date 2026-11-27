import type { ReactNode } from "react";
import { FormFieldError } from "@/components/shared/form-field-error";
import { cn } from "@/lib/utils";
import styles from "./school-form.module.css";

export function SchoolFormField({
  id,
  label,
  error,
  hint,
  children,
  className,
}: {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn(styles.field, className)}>
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
