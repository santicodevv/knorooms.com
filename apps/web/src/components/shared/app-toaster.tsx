"use client";
import { Toaster } from "react-hot-toast";
export function AppToaster() {
  return (
    <Toaster
      position="top-right"
      gutter={12}
      toastOptions={{
        duration: 5000,
        className: "!rounded-xl !border !border-slate-200 !text-sm !shadow-lg",
        success: { duration: 4000 },
        error: { duration: 7000 },
        ariaProps: { role: "status", "aria-live": "polite" },
      }}
    />
  );
}
