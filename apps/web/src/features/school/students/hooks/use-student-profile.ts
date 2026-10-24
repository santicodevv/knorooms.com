"use client";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
export function useStudentProfile() {
  const search = useSearchParams(),
    router = useRouter(),
    pathname = usePathname();
  const tab = search.get("tab") ?? "summary";
  const requestedBack = search.get("returnTo") ?? "";
  const back = /^\/students(?:\?|$)/.test(requestedBack) ? requestedBack : "/students";
  return {
    back,
    tab,
    setTab: (value: string) =>
      router.replace(
        pathname +
          "?" +
          new URLSearchParams({ ...Object.fromEntries(search.entries()), tab: value }).toString(),
        { scroll: false },
      ),
  };
}
