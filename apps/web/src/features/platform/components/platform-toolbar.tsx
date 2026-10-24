"use client";
import Link from "next/link";
import { Bell, ChevronDown, Search, ArrowRight } from "lucide-react";
import { LogoutButton } from "@/components/auth/logout-button";
import { usePlatformToolbar } from "../hooks/use-platform-toolbar";
import type { PlatformDashboardData } from "../schemas/dashboard-schemas";
export function PlatformToolbar({
  name,
  email,
  csrfToken,
  summary,
}: {
  name: string;
  email: string;
  csrfToken: string;
  summary: PlatformDashboardData | null;
}) {
  const { rootRef, inputRef, ...s } = usePlatformToolbar(name);
  const alerts = summary
    ? summary.pendingInvitations + summary.expiredInvitations + summary.failedInvitations
    : 0;
  return (
    <div ref={rootRef} className="flex w-full min-w-0 items-center justify-between gap-3">
      <div className="relative w-full max-w-[356px] sm:w-[36vw]">
        <Search className="text-muted pointer-events-none absolute top-3 left-3 size-4" />
        <input
          ref={inputRef}
          aria-label="Buscar instituciones en la plataforma"
          autoComplete="off"
          value={s.search}
          onChange={(e) => s.setSearch(e.target.value)}
          placeholder="Buscar instituciones…"
          className="border-control placeholder:text-muted h-[39px] w-full rounded-[10px] border bg-[#f7f9fc] pr-12 pl-9 text-xs text-slate-700"
        />
        <kbd className="text-muted absolute top-2.5 right-3 hidden rounded border border-slate-200 bg-white px-1 text-[11px] sm:block">
          ⌘ K
        </kbd>
        {s.search.trim() ? (
          <div className="border-divider absolute top-12 z-40 w-full rounded-xl border bg-white p-2 shadow-xl shadow-slate-900/10">
            {s.searching ? (
              <p className="text-muted p-3 text-xs">Buscando…</p>
            ) : s.searchError ? (
              <p role="alert" className="p-3 text-xs text-red-600">
                No se pudo completar la búsqueda.
              </p>
            ) : s.results.length ? (
              s.results.map((row) => (
                <Link
                  onClick={s.close}
                  key={row.id}
                  href={`/institutions/${row.id}`}
                  className="block rounded-lg p-3 hover:bg-blue-50"
                >
                  <span className="block text-xs font-semibold">{row.name}</span>
                  <span className="text-muted mt-1 block text-[11px]">{row.slug}</span>
                </Link>
              ))
            ) : (
              <p className="text-muted p-3 text-xs">Sin resultados.</p>
            )}
          </div>
        ) : null}
      </div>
      <div className="flex shrink-0 items-center gap-2 sm:gap-4">
        <div className="relative">
          <button
            type="button"
            aria-label="Avisos operativos"
            aria-expanded={s.popover === "notifications"}
            onClick={() => s.setPopover(s.popover === "notifications" ? null : "notifications")}
            className="relative flex size-9 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-50"
          >
            <Bell className="size-[18px]" />
            {alerts ? (
              <span className="absolute top-2 right-2 size-2 rounded-full border-2 border-white bg-red-400" />
            ) : null}
          </button>
          {s.popover === "notifications" ? (
            <div className="border-divider absolute top-12 right-0 z-40 w-[270px] rounded-xl border bg-white p-4 shadow-xl shadow-slate-900/10">
              <h2 className="mb-3 text-xs font-bold">Avisos operativos</h2>
              {summary ? (
                <div className="space-y-3 text-xs text-slate-500">
                  <p>{summary.pendingInvitations} invitaciones pendientes</p>
                  <p>{summary.expiredInvitations} invitaciones vencidas</p>
                  <p>{summary.failedInvitations} envíos fallidos</p>
                </div>
              ) : (
                <p className="text-muted text-xs">No se pudieron consultar los avisos.</p>
              )}
              <Link
                href="/institutions?administrator=NotActive"
                onClick={s.close}
                className="mt-4 flex items-center gap-2 text-xs font-semibold text-blue-600"
              >
                Revisar instituciones
                <ArrowRight className="size-3" />
              </Link>
            </div>
          ) : null}
        </div>
        <span className="hidden h-6 w-px bg-slate-100 sm:block" />
        <div className="relative">
          <button
            type="button"
            aria-label="Menú de la cuenta"
            aria-expanded={s.popover === "user"}
            onClick={() => s.setPopover(s.popover === "user" ? null : "user")}
            className="flex items-center gap-2.5 text-left"
          >
            <span className="flex size-9 items-center justify-center rounded-full bg-blue-100 text-[11px] font-bold text-blue-700">
              {s.initials}
            </span>
            <span className="hidden sm:block">
              <span className="block max-w-36 truncate text-xs font-semibold">{name}</span>
              <span className="text-muted mt-1 block text-[11px]">KNOROOMS</span>
            </span>
            <ChevronDown className="text-muted hidden size-3 sm:block" />
          </button>
          {s.popover === "user" ? (
            <div className="border-divider absolute top-12 right-0 z-40 w-60 rounded-xl border bg-white p-4 shadow-xl shadow-slate-900/10">
              <p className="text-xs font-semibold">{name}</p>
              <p className="text-muted my-3 text-[11px] break-all">{email}</p>
              <LogoutButton csrfToken={csrfToken} />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
