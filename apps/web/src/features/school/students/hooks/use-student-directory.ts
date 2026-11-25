"use client";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { filterGuardians, paginateRecords } from "../schemas/student-directory";
import type { GuardianDto } from "@/lib/api/types";
export function useStudentDirectory<T>(rows: readonly T[]) {
  const search = useSearchParams();
  const [page, setPage] = useState(Number(search.get("page")) || 1);
  const pagination = paginateRecords(rows, page);
  function updatePage(value: number) {
    setPage(value);
    const params = new URLSearchParams(window.location.search);
    params.set("page", String(value));
    window.history.replaceState(null, "", window.location.pathname + "?" + params);
  }
  return { ...pagination, setPage: updatePage };
}
export function useGuardianDirectory(rows: readonly GuardianDto[]) {
  const [query, setQuery] = useState("");
  const filtered = filterGuardians(rows, query);
  const list = useStudentDirectory(filtered);
  return {
    ...list,
    query,
    setQuery: (value: string) => {
      setQuery(value);
      list.setPage(1);
    },
  };
}
