"use client";
import { Menu, X } from "lucide-react";
import { SidebarContent } from "./sidebar-content";
import { useMobileSidebar } from "./hooks/use-mobile-sidebar";
import type { AppSidebarProps } from "./sidebar-types";
export type { AppSidebarProps, AppSidebarIconName, AppSidebarNavItem } from "./sidebar-types";
export function AppSidebar(props: AppSidebarProps) {
  const { setMobileOpen, dialogRef } = useMobileSidebar();
  return (
    <>
      <aside className="border-divider fixed inset-y-0 left-0 z-30 hidden w-[222px] border-r md:block xl:w-[246px]">
        <SidebarContent {...props} />
      </aside>
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-3 z-40 flex size-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 md:hidden"
        aria-label="Abrir menú de navegación"
      >
        <Menu className="size-5" />
      </button>
      <dialog
        ref={dialogRef}
        aria-label="Menú de navegación"
        onCancel={(event) => {
          event.preventDefault();
          setMobileOpen(false);
        }}
        className="fixed inset-0 m-0 h-dvh max-h-none w-full max-w-none border-0 bg-transparent p-0 backdrop:bg-slate-950/40 backdrop:backdrop-blur-sm"
      >
        <button
          type="button"
          className="absolute inset-0"
          aria-label="Cerrar fondo del menú"
          onClick={() => setMobileOpen(false)}
        />
        <div className="absolute inset-y-0 left-0 w-[250px] max-w-[88%] border-r border-slate-200 shadow-xl">
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="text-muted absolute top-2 right-2 z-10 flex size-7 items-center justify-center rounded-md hover:bg-slate-100"
            aria-label="Cerrar menú de navegación"
          >
            <X className="size-4" />
          </button>
          <SidebarContent {...props} onNavigate={() => setMobileOpen(false)} />
        </div>
      </dialog>
    </>
  );
}
