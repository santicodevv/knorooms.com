import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";
export function Input({ className, ...props }: ComponentProps<"input">) {
  return (
    <input
      data-ui="input"
      className={cn(
        "border-control placeholder:text-muted disabled:text-muted min-h-[38px] w-full min-w-0 rounded-[9px] border bg-white px-3 py-2 text-xs leading-5 text-slate-900 shadow-xs transition-colors file:mr-3 file:border-0 file:bg-blue-50 file:text-blue-700 hover:border-slate-600 focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10 focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-50 aria-invalid:border-red-500 aria-invalid:focus:ring-red-500/10",
        "school:min-h-12 school:rounded-school-control school:border-[1.5px] school:border-school-border school:px-4 school:text-school-body school:text-school-ink school:shadow-none school:transition-none school:placeholder:text-school-muted school:hover:border-school-border school:focus:border-school-ink school:focus:ring-0 school:focus-visible:outline-2 school:focus-visible:outline-solid school:focus-visible:-outline-offset-2 school:focus-visible:outline-school-ink school:disabled:bg-school-app school:disabled:text-school-muted school:aria-invalid:border-school-error school:aria-invalid:focus:ring-0 school:aria-invalid:focus-visible:outline-school-error",
        className,
      )}
      {...props}
    />
  );
}
