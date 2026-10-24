import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";
const tones = {
  default: "border-slate-200 bg-slate-50 text-slate-700",
  destructive: "border-red-200 bg-red-50 text-red-800",
  warning: "border-amber-200 bg-amber-50 text-amber-900",
  info: "border-blue-200 bg-blue-50 text-blue-800",
};
export function Alert({
  variant = "default",
  className,
  ...props
}: ComponentProps<"div"> & { variant?: keyof typeof tones }) {
  return (
    <div
      role="alert"
      className={cn(
        "relative rounded-xl border p-4 text-sm leading-6 [&>svg]:absolute [&>svg]:top-4.5 [&>svg]:left-4 [&>svg~*]:pl-7",
        tones[variant],
        className,
      )}
      {...props}
    />
  );
}
export function AlertTitle({ className, ...props }: ComponentProps<"h3">) {
  return <h3 className={cn("mb-1 font-semibold", className)} {...props} />;
}
export function AlertDescription({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("text-sm leading-6", className)} {...props} />;
}
