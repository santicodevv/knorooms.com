"use client";
import { useEffect, useRef, useState } from "react";
import { listInstitutionDirectory } from "../api/institution-management-api";
import type { InstitutionRow } from "../schemas/institution-management-schemas";
export function usePlatformToolbar(name: string) {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<InstitutionRow[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState(false);
  const [popover, setPopover] = useState<"notifications" | "user" | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    let active = true;
    if (!search.trim()) return;
    const timer = setTimeout(() => {
      setSearching(true);
      setSearchError(false);
      void listInstitutionDirectory({
        search,
        status: "",
        administrator: "",
        page: 1,
        pageSize: 10,
      }).then((result) => {
        if (active) {
          if (result.ok) setResults(result.data.items.slice(0, 5));
          else {
            setResults([]);
            setSearchError(true);
          }
          setSearching(false);
        }
      });
    }, 250);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [search]);
  useEffect(() => {
    const close = (event: PointerEvent) => {
      if (root.current && !root.current.contains(event.target as Node)) {
        setPopover(null);
        setSearch("");
      }
    };
    const key = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        input.current?.focus();
      }
      if (event.key === "Escape") {
        setSearch("");
        setPopover(null);
      }
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", key);
    };
  }, []);
  return {
    search,
    setSearch,
    results,
    searching,
    searchError,
    popover,
    setPopover,
    rootRef: root,
    inputRef: input,
    initials: name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((v) => v[0])
      .join("")
      .toUpperCase(),
    close: () => {
      setSearch("");
      setPopover(null);
    },
  };
}
