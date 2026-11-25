import type { FormEventHandler, ReactNode } from "react";
import { SidePanel } from "@/components/ui/side-panel";
import { Button } from "@/components/ui/button";
import { useStudentOverlay } from "../hooks/use-student-overlay";
import { StudentIcon } from "./student-icon";
import styles from "./students.module.css";
export function StudentSidePanel({
  title,
  subtitle,
  busy,
  onClose,
  onSubmit,
  submitLabel,
  children,
}: {
  title: string;
  subtitle: string;
  busy: boolean;
  onClose: () => void;
  onSubmit: FormEventHandler<HTMLFormElement>;
  submitLabel: string;
  children: ReactNode;
}) {
  const ref = useStudentOverlay(true);
  return (
    <SidePanel
      ref={ref}
      aria-labelledby="student-panel-title"
      onCancel={(e) => {
        e.preventDefault();
        if (!busy) onClose();
      }}
    >
      <form onSubmit={onSubmit} noValidate aria-busy={busy} className={styles.panelForm}>
        <header className={styles.panelHeader}>
          <div className="min-w-0 flex-1">
            <h2 id="student-panel-title" className="text-school-section">
              {title}
            </h2>
            <p className="text-school-small text-school-secondary mt-0.5">{subtitle}</p>
          </div>
          <Button
            type="button"
            aria-label="Cerrar panel"
            variant="secondary"
            size="icon"
            disabled={busy}
            onClick={onClose}
          >
            <StudentIcon name="close" />
          </Button>
        </header>
        <div className={styles.panelBody}>{children}</div>
        <footer className={styles.panelFooter}>
          <Button type="button" variant="outline" disabled={busy} onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={busy}>
            {busy ? "Guardando…" : submitLabel}
          </Button>
        </footer>
      </form>
    </SidePanel>
  );
}
