import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  variant?: "default" | "school";
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  variant = "default",
  className,
}: EmptyStateProps) {
  if (variant === "school")
    return (
      <div
        className={cn(
          "flex min-w-0 flex-1 flex-col items-center justify-center gap-5 p-10 text-center",
          className,
        )}
      >
        {icon ? (
          <div className="bg-school-subtle text-school-secondary flex size-18 shrink-0 items-center justify-center rounded-full [&>svg]:size-8">
            {icon}
          </div>
        ) : null}
        <div className="min-w-0">
          <p className="text-school-ink text-xl leading-[1.3] font-semibold tracking-[-0.01em]">
            {title}
          </p>
          {description ? (
            <p className="text-school-secondary mt-1.5 text-sm leading-5">{description}</p>
          ) : null}
        </div>
        {action ? <div className="flex flex-wrap justify-center gap-2">{action}</div> : null}
      </div>
    );
  return (
    <div
      className={cn(
        "rounded-lg border border-dashed border-slate-300 bg-slate-50/60 px-6 py-10 text-center",
        className,
      )}
    >
      {icon ? <div className="text-muted mx-auto mb-3 flex justify-center">{icon}</div> : null}
      <p className="text-sm font-medium text-slate-700">{title}</p>
      {description ? <p className="mt-1 text-xs text-slate-500">{description}</p> : null}
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
}
