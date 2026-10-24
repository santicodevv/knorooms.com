import Link from "next/link";
import { Shield, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { APP_SIDEBAR_ICONS, type AppSidebarProps } from "./sidebar-types";
export function SidebarContent({
  variant = "platform",
  brandName,
  brandSubtitle,
  brandIcon,
  navItems,
  activeKey,
  user,
  footer,
  navAriaLabel,
  onNavigate,
}: AppSidebarProps & { onNavigate?: () => void }) {
  const BrandIcon: LucideIcon = APP_SIDEBAR_ICONS[brandIcon];

  return (
    <div className="flex h-full flex-col bg-white">
      <div className="border-divider flex h-[83px] items-center gap-3 border-b px-[23px]">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
          <BrandIcon className="size-5" />
        </div>
        <div className="min-w-0">
          <div className="truncate text-[15px] font-extrabold tracking-tight text-slate-950">
            {brandName}
          </div>
          {brandSubtitle ? (
            <div className="truncate text-xs text-slate-500">{brandSubtitle}</div>
          ) : null}
        </div>
      </div>

      <nav aria-label={navAriaLabel} className="flex-1 space-y-1 overflow-y-auto px-3 py-[22px]">
        {variant === "platform" ? (
          <p className="text-muted mb-3 px-3 text-[11px] font-bold tracking-[0.18em] uppercase">
            Espacio de trabajo
          </p>
        ) : null}
        {navItems.map(({ key, href, label, icon, description, badge, group }, index) => {
          const isActive = key === activeKey;
          const Icon = APP_SIDEBAR_ICONS[icon];
          return (
            <div key={key}>
              {group && group !== navItems[index - 1]?.group ? (
                <p className="text-muted mt-5 mb-2 px-3 text-[10px] font-bold tracking-widest">
                  {group}
                </p>
              ) : null}
              <Link
                href={href}
                onClick={onNavigate}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "group flex items-center gap-3 rounded-[9px] px-3.5 py-3 text-[12.5px] font-semibold transition-colors",
                  isActive
                    ? "bg-[#eef4ff] text-blue-600"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                )}
              >
                <Icon
                  className={cn(
                    "size-[18px] shrink-0",
                    isActive ? "text-blue-600" : "text-muted group-hover:text-slate-600",
                  )}
                />
                <span className="min-w-0">
                  <span className="block truncate">{label}</span>
                  {description ? (
                    <span className="text-muted mt-0.5 block truncate text-xs font-normal">
                      {description}
                    </span>
                  ) : null}
                </span>
                {badge !== undefined ? (
                  <span className="ml-auto rounded-full bg-blue-100 px-2 py-0.5 text-[11px] text-blue-700">
                    {badge}
                  </span>
                ) : null}
              </Link>
            </div>
          );
        })}
        {variant === "platform" ? (
          <>
            {" "}
            <p className="text-muted mt-9 mb-3 px-3 text-[11px] font-bold tracking-[0.14em]">
              INFORMACIÓN
            </p>
            <p className="text-muted flex items-center gap-3 px-3 text-[11px]">
              <Shield className="size-4" />
              Plataforma administrativa
            </p>
          </>
        ) : null}
      </nav>

      <div className="border-divider border-t p-4">
        {variant === "platform" ? (
          <div className="mb-5 rounded-xl border border-blue-100 bg-blue-50/40 p-3.5">
            <p className="text-xs font-semibold text-slate-700">Cada colegio, su espacio</p>
            <p className="text-muted mt-2 text-[11px] leading-5">
              Gestiona módulos y accesos desde la ficha de cada institución.
            </p>
          </div>
        ) : null}
        <div className="mb-3 min-w-0">
          <div className="truncate text-sm font-semibold text-slate-900">{user.name}</div>
          <div className="truncate text-xs text-slate-500">{user.email}</div>
          {user.roleLabels && user.roleLabels.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-1">
              {user.roleLabels.map((role) => (
                <span
                  key={
                    role === "PlatformSuperAdmin"
                      ? "Superadministrador"
                      : role === "PlatformSupport"
                        ? "Soporte"
                        : role
                  }
                  className="inline-flex items-center rounded border border-slate-200 px-1.5 py-0.5 text-[11px] font-medium text-slate-600"
                >
                  {role === "PlatformSuperAdmin"
                    ? "Superadministrador"
                    : role === "PlatformSupport"
                      ? "Soporte"
                      : role}
                </span>
              ))}
            </div>
          ) : null}
        </div>
        {footer}
      </div>
    </div>
  );
}
