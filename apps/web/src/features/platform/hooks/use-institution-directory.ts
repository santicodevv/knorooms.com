"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { listInstitutionDirectory } from "../api/institution-management-api";
import {
  directoryQuery,
  type InstitutionPage,
  type DirectoryFilters,
  type InstitutionRow,
} from "../schemas/institution-management-schemas";
import type { ProblemDetails } from "@/lib/api/types";
export function useInstitutionDirectory(
  initial: InstitutionPage,
  initialFilters: DirectoryFilters,
  initialProblem: ProblemDetails | null,
) {
  const router = useRouter();
  const [data, setData] = useState(initial);
  const [filters, setFilters] = useState(initialFilters);
  const [problem, setProblem] = useState(initialProblem);
  const [loading, setLoading] = useState(false);
  const [invite, setInvite] = useState<InstitutionRow | null>(null);
  const request = useRef(0);
  useEffect(() => {
    const sequence = ++request.current;
    let cancelled = false;
    void listInstitutionDirectory(initialFilters).then((result) => {
      if (cancelled || sequence !== request.current) return;
      if (result.ok) {
        setData(result.data);
        setProblem(null);
      } else setProblem(result.problem);
    });
    return () => {
      cancelled = true;
    };
  }, [initialFilters]);
  useEffect(() => {
    const url = `/institutions?${directoryQuery(filters)}`;
    window.history.replaceState(null, "", url);
  }, [filters]);
  async function load(next: DirectoryFilters = filters) {
    const sequence = ++request.current;
    setLoading(true);
    const result = await listInstitutionDirectory(next);
    if (sequence !== request.current) return;
    if (result.ok) {
      setData(result.data);
      setProblem(null);
    } else {
      setProblem(result.problem);
      toast.error(result.problem.detail ?? "No se pudo cargar el listado.");
    }
    setLoading(false);
  }
  function apply(next: Partial<DirectoryFilters>) {
    const value = { ...filters, ...next, page: next.page ?? 1 };
    setFilters(value);
    void load(value);
  }
  const returnTo = `/institutions?${directoryQuery(filters)}`;
  function open(id: string, tab = "summary") {
    router.push(`/institutions/${id}?tab=${tab}&back=${encodeURIComponent(returnTo)}`);
  }
  const count = Math.max(1, Math.ceil(data.total / data.pageSize));
  const start = Math.max(1, Math.min(data.page - 2, count - 4));
  const pages = Array.from({ length: Math.min(5, count) }, (_, index) => start + index);
  return {
    pages,
    hasFilters: Boolean(filters.search || filters.status || filters.administrator),
    data,
    filters,
    problem,
    loading,
    invite,
    setInvite,
    apply,
    refresh: () => load(),
    open,
    returnTo,
  };
}
