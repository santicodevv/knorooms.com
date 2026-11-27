import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export function Skeleton({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      {...props}
      aria-hidden="true"
      data-ui="skeleton"
      className={cn("rounded-school-control bg-school-subtle h-4", className)}
    />
  );
}
