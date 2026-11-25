import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

export type MenuItemProps = ComponentProps<typeof Link> & {
  active?: boolean;
  icon?: ReactNode;
};

export function MenuItem({ active = false, icon, className, children, ...props }: MenuItemProps) {
  return (
    <Link
      {...props}
      aria-current={active ? "page" : undefined}
      data-ui="menu-item"
      className={cn(
        "rounded-school-control text-school-body text-school-secondary hover:bg-school-subtle aria-[current=page]:bg-school-ink aria-[current=page]:text-school-surface flex min-h-11 items-center gap-3 px-3.5 font-medium aria-[current=page]:font-semibold",
        className,
      )}
    >
      {icon && (
        <span aria-hidden="true" className="shrink-0 [&>svg]:size-5 [&>svg]:stroke-2">
          {icon}
        </span>
      )}
      <span className="min-w-0 flex-1">{children}</span>
    </Link>
  );
}
