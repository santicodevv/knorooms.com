"use client";
import { useEffect, useId, useRef, useState } from "react";
export function useRowActions() {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const id = useId();
  const [position, setPosition] = useState({ left: 0, top: 0 });
  function positionMenu() {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setPosition({
      left: Math.max(12, Math.min(rect.right - 208, window.innerWidth - 220)),
      top: rect.bottom + 160 > window.innerHeight ? Math.max(12, rect.top - 154) : rect.bottom + 7,
    });
  }
  function close() {
    panelRef.current?.hidePopover();
  }
  useEffect(() => {
    const hide = () => panelRef.current?.hidePopover();
    window.addEventListener("resize", hide);
    window.addEventListener("scroll", hide, true);
    return () => {
      window.removeEventListener("resize", hide);
      window.removeEventListener("scroll", hide, true);
    };
  }, []);
  return { triggerRef, panelRef, id, position, positionMenu, close };
}
