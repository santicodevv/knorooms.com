"use client";
import { useEffect, useId, useRef } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
export function ActionDialog({
  open,
  title,
  busy = false,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  busy?: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const id = useId();
  useEffect(() => {
    const element = ref.current;
    if (open && !element?.open) element?.showModal();
    if (!open && element?.open) element.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      aria-labelledby={id}
      onCancel={(e) => {
        e.preventDefault();
        if (!busy) onClose();
      }}
      className="fixed m-auto max-h-[90dvh] w-[calc(100%_-_2rem)] max-w-[460px] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-0 text-slate-900 shadow-2xl backdrop:bg-slate-950/45 backdrop:backdrop-blur-sm"
    >
      <div className="flex items-center justify-between px-6 pt-[22px] pb-0">
        <h2 id={id} className="text-[17px] font-bold tracking-tight">
          {title}
        </h2>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Cerrar"
          disabled={busy}
          onClick={onClose}
        >
          <X />
        </Button>
      </div>
      <div className="px-6 pt-5 pb-6">{children}</div>
    </dialog>
  );
}
