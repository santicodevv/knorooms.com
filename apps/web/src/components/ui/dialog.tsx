import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export type DialogProps = ComponentProps<"dialog"> & { "aria-labelledby": string };

// El consumidor abre con showModal(): el navegador conserva foco, Escape e inercia del fondo.
export function Dialog({ className, ...props }: DialogProps) {
  return (
    <dialog
      {...props}
      data-ui="dialog"
      className={cn(
        "max-w-school-dialog rounded-school-panel bg-school-surface text-school-body text-school-ink backdrop:bg-school-overlay fixed m-auto max-h-[calc(100dvh_-_2rem)] w-[calc(100%_-_2rem)] overflow-y-auto border-0 p-7",
        className,
      )}
    />
  );
}
