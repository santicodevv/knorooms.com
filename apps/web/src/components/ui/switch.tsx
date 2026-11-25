import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export function Switch({ className, ...props }: Omit<ComponentProps<"input">, "type" | "role">) {
  return (
    <input
      {...props}
      type="checkbox"
      role="switch"
      data-ui="switch"
      className={cn(
        "ui-switch bg-school-border checked:bg-school-ink h-6.5 w-11 shrink-0 cursor-pointer appearance-none rounded-full disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
    />
  );
}
