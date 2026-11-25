import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export function Checkbox({ className, ...props }: Omit<ComponentProps<"input">, "type">) {
  return (
    <input
      {...props}
      type="checkbox"
      data-ui="checkbox"
      className={cn(
        "accent-school-ink size-5 shrink-0 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
    />
  );
}
