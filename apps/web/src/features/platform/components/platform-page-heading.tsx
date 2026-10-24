import type { ReactNode } from "react";
export function PlatformPageHeading({
  title,
  description,
  action,
  breadcrumb,
}: {
  title: string;
  description: string;
  action?: ReactNode;
  breadcrumb?: ReactNode;
}) {
  return (
    <header className="mb-6">
      {breadcrumb ? (
        <div className="text-muted mb-5 flex flex-wrap items-center gap-2 text-xs">
          {breadcrumb}
        </div>
      ) : null}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-[-0.7px] text-[#151e33]">{title}</h1>
          <p className="text-muted mt-2 max-w-2xl text-xs leading-5">{description}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">{action}</div>
      </div>
    </header>
  );
}
