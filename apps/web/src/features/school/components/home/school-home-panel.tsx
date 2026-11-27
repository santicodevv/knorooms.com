import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import styles from "./school-home.module.css";
export function SchoolHomePanel({
  title,
  description,
  actions,
  children,
  className,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn(styles.panel, className)}>
      <header className={styles.panelHeader}>
        <div className="min-w-0">
          <h2 className={styles.panelTitle}>{title}</h2>
          {description && <p className={styles.panelDescription}>{description}</p>}
        </div>
        {actions}
      </header>
      {children}
    </section>
  );
}
