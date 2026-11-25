import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";
export function Label({ className, ...props }: ComponentProps<"label">) {
  return (
    <label
      data-ui="label"
      className={cn(
        "school:text-school-button school:font-medium school:text-school-ink text-sm leading-5 font-semibold text-slate-700",
        className,
      )}
      {...props}
    />
  );
}
