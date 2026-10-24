import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";
export function Label({ className, ...props }: ComponentProps<"label">) {
  return (
    <label className={cn("text-sm leading-5 font-semibold text-slate-700", className)} {...props} />
  );
}
