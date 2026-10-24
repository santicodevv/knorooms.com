"use client";
import { useState, useRef, useEffect } from "react";
export function useMobileSidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = dialogRef.current;
    if (mobileOpen && !dialog?.open) dialog?.showModal();
    if (!mobileOpen && dialog?.open) dialog.close();
    if (!mobileOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const media = window.matchMedia("(min-width: 768px)");
    const closeOnDesktop = () => {
      if (media.matches) setMobileOpen(false);
    };
    media.addEventListener("change", closeOnDesktop);
    return () => {
      document.body.style.overflow = previous;
      media.removeEventListener("change", closeOnDesktop);
    };
  }, [mobileOpen]);
  return { setMobileOpen, dialogRef };
}
