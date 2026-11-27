import { Dialog, type DialogProps } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export function SidePanel({ className, ...props }: DialogProps) {
  return (
    <Dialog
      {...props}
      data-panel="side"
      className={cn(
        "max-w-school-panel inset-y-0 right-0 left-auto m-0 h-dvh max-h-dvh w-full rounded-none p-0",
        className,
      )}
    />
  );
}
