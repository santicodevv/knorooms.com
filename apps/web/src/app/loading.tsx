import { LoaderCircle } from "lucide-react";

export default function Loading() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="bg-school-app text-school-secondary flex min-h-dvh w-full flex-1 items-center justify-center px-6 py-10"
    >
      <div className="flex flex-col items-center gap-4 text-center">
        <LoaderCircle
          size={28}
          strokeWidth={1.5}
          className="motion-safe:animate-spin"
          aria-hidden="true"
        />
        <p className="text-sm leading-5 font-medium">Cargando información…</p>
      </div>
    </div>
  );
}
