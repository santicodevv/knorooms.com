"use client";
import { useId, type FormEventHandler, type ReactNode } from "react";
import { SidePanel } from "@/components/ui/side-panel";
import { Button } from "@/components/ui/button";
import { SchoolIcon } from "@/components/shared/school-icon";
import { useSchoolDialog } from "../hooks/use-school-dialog";
import styles from "./school-form.module.css";

export interface SchoolSidePanelProps {
  title: string;
  subtitle: string;
  busy: boolean;
  onClose: () => void;
  onSubmit: FormEventHandler<HTMLFormElement>;
  submitLabel: string;
  children: ReactNode;
  titleId?: string;
  submitDisabled?: boolean;
}

export function SchoolSidePanel({
  title,
  subtitle,
  busy,
  onClose,
  onSubmit,
  submitLabel,
  children,
  titleId,
  submitDisabled = false,
}: SchoolSidePanelProps) {
  const ref = useSchoolDialog(true);
  const generatedId = useId();
  const labelledBy = titleId ?? generatedId;
  return (
    <SidePanel
      ref={ref}
      aria-labelledby={labelledBy}
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onClose();
      }}
    >
      <form onSubmit={onSubmit} noValidate aria-busy={busy} className={styles.panelForm}>
        <header className={styles.panelHeader}>
          <div className="min-w-0 flex-1">
            <h2 id={labelledBy} className="text-school-section">
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
            <SchoolIcon name="close" />
          </Button>
        </header>
        <div className={styles.panelBody}>{children}</div>
        <footer className={styles.panelFooter}>
          <Button type="button" variant="outline" disabled={busy} onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={busy || submitDisabled}>
            {busy ? "Guardando…" : submitLabel}
          </Button>
        </footer>
      </form>
    </SidePanel>
  );
}
