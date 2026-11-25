import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";
const tones = {
  default: "bg-blue-50 text-blue-800 ring-blue-600/25",
  secondary: "bg-slate-100 text-slate-600 ring-slate-500/10",
  destructive: "bg-red-50 text-red-800 ring-red-600/25",
  success: "bg-emerald-50 text-emerald-800 ring-emerald-600/25",
  warning: "bg-amber-50 text-amber-800 ring-amber-600/10",
  outline: "bg-white text-slate-600 ring-slate-300",
};
const schoolTones = {
  default: "school:bg-school-subtle school:text-school-secondary",
  secondary: "school:bg-school-subtle school:text-school-secondary",
  destructive: "school:bg-school-error-bg school:text-school-error",
  success: "school:bg-school-success-bg school:text-school-success",
  warning: "school:bg-school-warning-bg school:text-school-warning",
  outline:
    "school:bg-school-surface school:text-school-secondary school:ring-1 school:ring-school-border",
};
export type BadgeProps = ComponentProps<"span"> & { variant?: keyof typeof tones };
export function Badge({ variant = "default", className, ...props }: BadgeProps) {
  return (
    <span
      data-ui="badge"
      data-variant={variant}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[10px] leading-4 font-semibold whitespace-nowrap ring-1 ring-inset",
        tones[variant],
        "school:rounded-full school:px-2.5 school:py-1 school:text-school-label school:font-medium school:ring-0",
        schoolTones[variant],
        className,
      )}
      {...props}
    />
  );
}
