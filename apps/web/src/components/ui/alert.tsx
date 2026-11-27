import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";
const tones = {
  default: "border-slate-200 bg-slate-50 text-slate-700",
  destructive: "border-red-200 bg-red-50 text-red-800",
  warning: "border-amber-200 bg-amber-50 text-amber-900",
  info: "border-blue-200 bg-blue-50 text-blue-800",
  success: "border-emerald-200 bg-emerald-50 text-emerald-800",
};
const schoolTones = {
  default: "school:bg-school-app school:text-school-secondary",
  destructive: "school:bg-school-error-bg school:text-school-error",
  warning: "school:bg-school-warning-bg school:text-school-warning",
  info: "school:bg-school-app school:text-school-secondary",
  success: "school:bg-school-success-bg school:text-school-success",
};
export function Alert({
  variant = "default",
  className,
  ...props
}: ComponentProps<"div"> & { variant?: keyof typeof tones }) {
  return (
    <div
      data-ui="alert"
      data-variant={variant}
      role="alert"
      className={cn(
        "relative rounded-xl border p-4 text-sm leading-6 [&>svg]:absolute [&>svg]:top-4.5 [&>svg]:left-4 [&>svg~*]:pl-7",
        tones[variant],
        schoolTones[variant],
        "school:rounded-school-card school:border-school-border school:text-school-body",
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
  return <div className={cn("school:text-school-body text-sm leading-6", className)} {...props} />;
}
