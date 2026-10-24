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
export type BadgeProps = ComponentProps<"span"> & { variant?: keyof typeof tones };
export function Badge({ variant = "default", className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[10px] leading-4 font-semibold whitespace-nowrap ring-1 ring-inset",
        tones[variant],
        className,
      )}
      {...props}
    />
  );
}
