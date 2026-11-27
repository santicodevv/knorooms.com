"use client";
import Link from "next/link";
import { ChevronDown, ChevronUp } from "lucide-react";
import { MenuItem } from "@/components/ui/menu-item";
import { useSchoolNavigation } from "@/features/school/hooks/use-school-navigation";
import { SCHOOL_NAV_GROUPS } from "@/features/school/navigation/school-navigation";
import { cn } from "@/lib/utils";
import { APP_SIDEBAR_ICONS, type AppSidebarProps } from "./sidebar-types";
export function SchoolSidebarContent({
  brandName,
  brandSubtitle,
  navItems,
  activeKey,
  user,
  footer,
  navAriaLabel,
  onNavigate,
}: AppSidebarProps & { onNavigate?: () => void }) {
  const navigation = useSchoolNavigation(navItems, activeKey);
  const initials = user.name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
  const Building = APP_SIDEBAR_ICONS.building;
  return (
    <div className="bg-school-surface text-school-secondary flex h-full flex-col">
      <div className="border-school-border flex min-h-22 items-center gap-3 border-b px-5 py-6">
        <span className="bg-school-ink text-school-surface flex size-10 shrink-0 items-center justify-center rounded-xl">
          <Building className="size-5.5" strokeWidth={2} aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="text-school-ink truncate text-base font-bold tracking-tight">{brandName}</p>
          <p className="text-school-secondary text-school-label truncate">{brandSubtitle}</p>
        </div>
      </div>
      <nav aria-label={navAriaLabel} className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {navItems
          .filter((item) => !item.group)
          .map((item) => {
            const Icon = APP_SIDEBAR_ICONS[item.icon];
            return (
              <MenuItem
                key={item.key}
                href={item.href}
                active={navigation.activeKey === item.key}
                icon={<Icon />}
                className="ui-button"
                onClick={onNavigate}
              >
                {item.label}
              </MenuItem>
            );
          })}
        {SCHOOL_NAV_GROUPS.map((group) => {
          const items = navItems.filter((item) => item.group === group.label);
          if (!items.length) return null;
          const expanded = navigation.expandedGroup === group.label;
          const Icon = APP_SIDEBAR_ICONS[group.icon];
          const Chevron = expanded ? ChevronUp : ChevronDown;
          const groupId = navigation.idPrefix + "-school-nav-" + group.icon;
          return (
            <div key={group.label}>
              <button
                type="button"
                aria-expanded={expanded}
                aria-controls={groupId}
                onClick={() => navigation.toggleGroup(group.label)}
                className={cn(
                  "ui-button text-school-body hover:bg-school-subtle rounded-school-control flex min-h-11 w-full items-center gap-3 px-3.5 text-left",
                  expanded && "text-school-ink font-semibold",
                )}
              >
                <Icon className="size-5 shrink-0" strokeWidth={2} aria-hidden="true" />
                <span className="flex-1">{group.label}</span>
                <Chevron className="size-4 shrink-0" aria-hidden="true" />
              </button>
              <div id={groupId} hidden={!expanded} className="mt-1 space-y-1">
                {items.map((item) => {
                  const ItemIcon = APP_SIDEBAR_ICONS[item.icon];
                  const active = navigation.activeKey === item.key;
                  return (
                    <Link
                      key={item.key}
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      onClick={onNavigate}
                      className={cn(
                        "ui-button text-school-button hover:bg-school-subtle rounded-school-control flex min-h-10 items-center gap-3 py-2.5 pr-3.5 pl-9.5",
                        active &&
                          "bg-school-ink text-school-surface hover:bg-school-ink font-semibold",
                      )}
                    >
                      <ItemIcon className="size-4.5 shrink-0" strokeWidth={2} aria-hidden="true" />
                      <span className="min-w-0 flex-1">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>
      <div className="border-school-border border-t p-4">
        <div className="mb-3 flex min-w-0 items-center gap-3">
          <span
            aria-hidden="true"
            className="bg-school-subtle text-school-ink text-school-small flex size-10 shrink-0 items-center justify-center rounded-full font-semibold"
          >
            {initials}
          </span>
          <div className="min-w-0">
            <p className="text-school-ink text-school-small truncate font-semibold">{user.name}</p>
            {user.roleLabels?.length ? (
              <p className="text-school-secondary text-school-label truncate">
                {user.roleLabels.join(", ")}
              </p>
            ) : (
              <p className="text-school-secondary text-school-label truncate">{user.email}</p>
            )}
          </div>
        </div>
        {footer}
      </div>
    </div>
  );
}
