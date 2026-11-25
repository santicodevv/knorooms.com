import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";
export function Card({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-ui="card"
      className={cn(
        "border-divider school:rounded-school-card school:border-school-border school:bg-school-surface school:text-school-ink school:shadow-none rounded-2xl border bg-white text-slate-900 shadow-sm shadow-slate-200/40",
        className,
      )}
      {...props}
    />
  );
}
export function CardHeader({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-ui="card-header"
      className={cn("flex flex-col gap-2 p-5 sm:p-6", className)}
      {...props}
    />
  );
}
export function CardTitle({ className, ...props }: ComponentProps<"h3">) {
  return (
    <h3
      data-ui="card-title"
      className={cn(
        "school:text-school-card text-base leading-6 font-semibold tracking-tight",
        className,
      )}
      {...props}
    />
  );
}
export function CardDescription({ className, ...props }: ComponentProps<"p">) {
  return (
    <p
      data-ui="card-description"
      className={cn(
        "text-muted school:text-school-small school:text-school-secondary text-sm leading-6",
        className,
      )}
      {...props}
    />
  );
}
export function CardContent({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("p-5 pt-0 sm:p-6 sm:pt-0", className)} {...props} />;
}
export function CardFooter({ className, ...props }: ComponentProps<"div">) {
  return (
    <div className={cn("flex items-center gap-3 p-5 pt-0 sm:p-6 sm:pt-0", className)} {...props} />
  );
}
