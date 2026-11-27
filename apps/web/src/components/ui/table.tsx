import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";
export function Table({ className, ...props }: ComponentProps<"table">) {
  return (
    <div className="w-full overflow-x-auto">
      <table
        data-ui="table"
        className={cn("school:text-school-body w-full caption-bottom text-left text-sm", className)}
        {...props}
      />
    </div>
  );
}
export function TableHeader({ className, ...props }: ComponentProps<"thead">) {
  return (
    <thead
      data-ui="table-header"
      className={cn(
        "border-divider school:border-school-border school:bg-school-app border-y bg-slate-100",
        className,
      )}
      {...props}
    />
  );
}
export function TableBody({ className, ...props }: ComponentProps<"tbody">) {
  return (
    <tbody
      className={cn("school:divide-school-border divide-y divide-slate-100", className)}
      {...props}
    />
  );
}
export function TableFooter({ className, ...props }: ComponentProps<"tfoot">) {
  return (
    <tfoot
      className={cn(
        "school:border-school-border school:bg-school-app border-t border-slate-200 bg-slate-50 font-medium",
        className,
      )}
      {...props}
    />
  );
}
export function TableRow({ className, ...props }: ComponentProps<"tr">) {
  return (
    <tr
      data-ui="table-row"
      className={cn(
        "school:transition-none school:hover:bg-school-app school:data-[state=selected]:bg-school-subtle transition-colors hover:bg-blue-50/30 data-[state=selected]:bg-blue-50",
        className,
      )}
      {...props}
    />
  );
}
export function TableHead({ className, scope = "col", ...props }: ComponentProps<"th">) {
  return (
    <th
      data-ui="table-head"
      scope={scope}
      className={cn(
        "text-muted school:px-6 school:py-3 school:text-school-small school:font-medium school:text-school-muted px-5 py-3.5 text-left text-xs font-semibold",
        className,
      )}
      {...props}
    />
  );
}
export function TableCell({ className, ...props }: ComponentProps<"td">) {
  return (
    <td
      data-ui="table-cell"
      className={cn(
        "school:px-6 school:py-5 school:text-school-secondary px-5 py-4 align-middle text-slate-700",
        className,
      )}
      {...props}
    />
  );
}
export function TableCaption({ className, ...props }: ComponentProps<"caption">) {
  return <caption className={cn("text-muted mt-4 text-sm", className)} {...props} />;
}
