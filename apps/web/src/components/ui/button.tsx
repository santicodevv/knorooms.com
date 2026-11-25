import Link from "next/link";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

const tones = {
  default:
    "border-transparent bg-blue-600 text-white shadow-sm shadow-blue-600/15 hover:bg-blue-700 active:bg-blue-800",
  outline:
    "border-control bg-white text-slate-700 shadow-xs hover:border-blue-600 hover:bg-blue-50 hover:text-blue-700",
  secondary: "border-transparent bg-blue-50 text-blue-700 hover:bg-blue-100",
  ghost: "border-transparent bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-950",
  destructive: "border-transparent bg-red-600 text-white hover:bg-red-700",
  link: "border-transparent bg-transparent text-blue-600 underline-offset-4 hover:underline",
};
const sizes = {
  default: "min-h-9 px-3.5 py-2 text-xs",
  sm: "min-h-[30px] px-2.5 py-1.5 text-[11px]",
  lg: "min-h-[42px] px-[18px] py-2.5 text-xs",
  icon: "size-9 shrink-0 p-2",
};
const schoolTones = {
  default:
    "school:border-transparent school:bg-school-ink school:text-school-surface school:shadow-none school:hover:bg-school-ink school:hover:opacity-80 school:active:bg-school-ink",
  outline:
    "school:border-school-border school:bg-school-surface school:text-school-ink school:shadow-none school:hover:border-school-border school:hover:bg-school-app school:hover:text-school-ink",
  secondary:
    "school:border-transparent school:bg-school-subtle school:text-school-ink school:hover:bg-school-subtle school:hover:opacity-80",
  ghost:
    "school:border-transparent school:text-school-secondary school:hover:bg-school-subtle school:hover:text-school-ink",
  destructive:
    "school:bg-school-error school:text-school-surface school:hover:bg-school-error school:hover:opacity-80",
  link: "school:text-school-ink",
};
const schoolSizes = {
  default: "school:min-h-11 school:px-4.5 school:py-2.5",
  sm: "school:min-h-9 school:px-3 school:py-2 school:text-school-small",
  lg: "school:min-h-12 school:px-5 school:py-3",
  icon: "school:size-10 school:min-h-10 school:p-2.5",
};
type Appearance = { variant?: keyof typeof tones; size?: keyof typeof sizes; className?: string };
export function buttonStyles({
  variant = "default",
  size = "default",
  className,
}: Appearance = {}) {
  return cn(
    "ui-button",
    "inline-flex items-center justify-center gap-2 rounded-[9px] border font-semibold leading-5 transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:border-slate-300 disabled:bg-slate-100 disabled:text-slate-600 disabled:shadow-none [&_svg]:size-4 [&_svg]:shrink-0",
    tones[variant],
    sizes[size],
    "school:rounded-school-control school:border-[1.5px] school:text-school-button school:transition-none school:focus-visible:outline-school-ink school:disabled:border-school-border school:disabled:bg-school-subtle school:disabled:text-school-muted school:disabled:opacity-100 school:[&_svg]:size-4.5",
    schoolTones[variant],
    schoolSizes[size],
    className,
  );
}
export type ButtonProps = ComponentProps<"button"> & Appearance;
export function Button({ variant, size, className, type = "button", ...props }: ButtonProps) {
  return <button type={type} className={buttonStyles({ variant, size, className })} {...props} />;
}
export function ButtonLink({
  variant,
  size,
  className,
  ...props
}: ComponentProps<typeof Link> & Appearance) {
  return <Link className={buttonStyles({ variant, size, className })} {...props} />;
}
