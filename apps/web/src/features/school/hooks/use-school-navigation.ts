"use client";
import { useId, useState } from "react";
import { usePathname } from "next/navigation";
import type { AppSidebarNavItem } from "@/components/shell/app-sidebar";
import { getActiveSchoolNavigationItem } from "../navigation/school-navigation";
export function useSchoolNavigation(items: readonly AppSidebarNavItem[], fallbackKey: string) {
  const pathname = usePathname();
  const idPrefix = useId();
  const activeItem = getActiveSchoolNavigationItem(items, pathname, fallbackKey);
  const routeKey = activeItem?.key ?? fallbackKey;
  const [selection, setSelection] = useState<{ routeKey: string; group: string | null } | null>(
    null,
  );
  const expandedGroup =
    selection?.routeKey === routeKey ? selection.group : (activeItem?.group ?? null);
  function toggleGroup(group: string) {
    setSelection({ routeKey, group: expandedGroup === group ? null : group });
  }
  return { activeKey: routeKey, expandedGroup, toggleGroup, idPrefix };
}
