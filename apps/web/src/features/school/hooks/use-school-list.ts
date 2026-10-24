"use client";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
export function useSchoolList<T>(rows: T[], size = 10) {
  const query = useSearchParams();
  const [page, updatePage] = useState(Math.max(1, Number(query.get("page")) || 1));
  const setPage = (value: number) => {
    updatePage(value);
    const q = new URLSearchParams(window.location.search);
    q.set("page", String(value));
    window.history.replaceState(null, "", window.location.pathname + "?" + q.toString());
  };
  const pages = Math.max(1, Math.ceil(rows.length / size));
  const current = Math.min(page, pages);
  return {
    page: current,
    pages,
    setPage,
    rows: rows.slice((current - 1) * size, current * size),
    total: rows.length,
  };
}
