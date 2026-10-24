import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";
export function Input({ className, ...props }: ComponentProps<"input">) {
  return (
    <input
      className={cn(
        "border-control placeholder:text-muted disabled:text-muted min-h-[38px] w-full min-w-0 rounded-[9px] border bg-white px-3 py-2 text-xs leading-5 text-slate-900 shadow-xs transition-colors file:mr-3 file:border-0 file:bg-blue-50 file:text-blue-700 hover:border-slate-600 focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10 focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-50 aria-invalid:border-red-500 aria-invalid:focus:ring-red-500/10",
        className,
      )}
      {...props}
    />
  );
}
