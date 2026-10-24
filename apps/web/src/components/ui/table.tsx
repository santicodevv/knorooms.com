import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";
export function Table({ className, ...props }: ComponentProps<"table">) {
  return (
    <div className="w-full overflow-x-auto">
      <table className={cn("w-full caption-bottom text-left text-sm", className)} {...props} />
    </div>
  );
}
export function TableHeader({ className, ...props }: ComponentProps<"thead">) {
  return <thead className={cn("border-divider border-y bg-slate-100", className)} {...props} />;
}
export function TableBody({ className, ...props }: ComponentProps<"tbody">) {
  return <tbody className={cn("divide-y divide-slate-100", className)} {...props} />;
}
export function TableFooter({ className, ...props }: ComponentProps<"tfoot">) {
  return (
    <tfoot
      className={cn("border-t border-slate-200 bg-slate-50 font-medium", className)}
      {...props}
    />
  );
}
export function TableRow({ className, ...props }: ComponentProps<"tr">) {
  return (
    <tr
      className={cn(
        "transition-colors hover:bg-blue-50/30 data-[state=selected]:bg-blue-50",
        className,
      )}
      {...props}
    />
  );
}
export function TableHead({ className, scope = "col", ...props }: ComponentProps<"th">) {
  return (
    <th
      scope={scope}
      className={cn("text-muted px-5 py-3.5 text-left text-xs font-semibold", className)}
      {...props}
    />
  );
}
export function TableCell({ className, ...props }: ComponentProps<"td">) {
  return <td className={cn("px-5 py-4 align-middle text-slate-700", className)} {...props} />;
}
export function TableCaption({ className, ...props }: ComponentProps<"caption">) {
  return <caption className={cn("text-muted mt-4 text-sm", className)} {...props} />;
}
