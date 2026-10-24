import Link from "next/link";
import type { ReactNode } from "react";
import { RefreshCw, ArrowLeft } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/button";
export function SchoolPageHeading({
  title,
  description,
  actions,
  back,
  onRefresh,
  refreshing = false,
}: {
  title: string;
  description: string;
  actions?: ReactNode;
  back?: string;
  onRefresh?: () => void;
  refreshing?: boolean;
}) {
  return (
    <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        {back && (
          <Link
            href={back}
            className="mb-4 inline-flex items-center gap-2 text-xs font-semibold text-blue-700"
          >
            <ArrowLeft className="size-3.5" />
            Volver al listado
          </Link>
        )}
        <p className="text-muted mb-2 text-[10px] font-bold tracking-[.14em] uppercase">
          Portal del colegio
        </p>
        <h1 className="text-[26px] leading-tight font-extrabold tracking-tight text-slate-900">
          {title}
        </h1>
        <p className="text-muted mt-2 max-w-2xl text-xs leading-6">{description}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {onRefresh && (
          <Button variant="outline" disabled={refreshing} onClick={onRefresh}>
            <RefreshCw className={refreshing ? "animate-spin" : ""} />
            Actualizar
          </Button>
        )}
        {actions}
      </div>
    </header>
  );
}
export function SchoolPanel({
  title,
  description,
  actions,
  children,
  className = "",
}: {
  title?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={
        "border-divider overflow-hidden rounded-[14px] border bg-white shadow-[0_2px_10px_rgba(17,34,65,.025)] " +
        className
      }
    >
      {title && (
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-5">
          <div>
            <h2 className="text-[13px] font-bold text-slate-900">{title}</h2>
            {description && <p className="text-muted mt-1.5 text-xs leading-5">{description}</p>}
          </div>
          {actions}
        </header>
      )}
      {children}
    </section>
  );
}
export function SchoolTabs({
  items,
  active,
}: {
  items: { key: string; label: string; href: string }[];
  active: string;
}) {
  return (
    <nav
      aria-label="Vistas de la sección"
      className="mb-5 flex gap-6 overflow-x-auto border-b border-slate-300"
    >
      {items.map((i) => (
        <Link
          key={i.key}
          href={i.href}
          aria-current={active === i.key ? "page" : undefined}
          className={
            "shrink-0 border-b-2 px-1 py-3.5 text-xs font-semibold " +
            (active === i.key
              ? "border-blue-600 text-blue-700"
              : "text-muted border-transparent hover:text-slate-950")
          }
        >
          {i.label}
        </Link>
      ))}
    </nav>
  );
}
export function SchoolMetrics({
  items,
}: {
  items: { label: string; value: string | number; note?: string }[];
}) {
  return (
    <div className="mb-5 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
      {items.map((i) => (
        <SchoolPanel key={i.label}>
          <div className="p-5">
            <p className="text-muted text-xs font-medium">{i.label}</p>
            <p className="mt-3 text-[28px] leading-none font-extrabold tracking-tight text-slate-900 tabular-nums">
              {i.value}
            </p>
            {i.note && <p className="text-muted mt-3 text-[11px]">{i.note}</p>}
          </div>
        </SchoolPanel>
      ))}
    </div>
  );
}
export function SchoolField({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="block min-w-0 space-y-2 text-xs font-semibold text-slate-700">
      <span>{label}</span>
      {children}
      {error && (
        <span role="alert" className="block text-xs font-normal text-red-700">
          {error}
        </span>
      )}
    </label>
  );
}
export const schoolSelectClass =
  "min-h-[38px] w-full min-w-0 rounded-[9px] border border-control bg-white px-3 py-2 text-xs font-normal text-slate-900";
export function SchoolFormFrame({
  title,
  description,
  back,
  children,
}: {
  title: string;
  description: string;
  back: string;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-3xl">
      <SchoolPageHeading title={title} description={description} back={back} />
      <SchoolPanel
        title="Datos del registro"
        description="Completa los campos requeridos para guardar."
      >
        {children}
      </SchoolPanel>
    </div>
  );
}
export function SchoolFormActions({
  back,
  busy,
  label = "Guardar registro",
}: {
  back: string;
  busy: boolean;
  label?: string;
}) {
  return (
    <footer className="flex justify-end gap-3 border-t border-slate-200 pt-5">
      <ButtonLink href={back} variant="outline">
        Cancelar
      </ButtonLink>
      <button
        type="submit"
        disabled={busy}
        className="rounded-[9px] bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:bg-slate-100 disabled:text-slate-600"
      >
        {busy ? "Guardando…" : label}
      </button>
    </footer>
  );
}
