import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
export function PlatformPanel({
  title,
  description,
  action,
  children,
  className,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "border-divider min-w-0 rounded-[13px] border bg-white p-5 shadow-[0_2px_16px_rgba(20,43,89,0.035)] sm:p-[22px]",
        className,
      )}
    >
      <header className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-[13px] font-bold tracking-tight text-[#151e33]">{title}</h2>
          {description ? (
            <p className="text-muted mt-1 text-[11px] leading-5">{description}</p>
          ) : null}
        </div>
        {action}
      </header>
      {children}
    </section>
  );
}
