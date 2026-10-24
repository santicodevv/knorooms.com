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
type Appearance = { variant?: keyof typeof tones; size?: keyof typeof sizes; className?: string };
export function buttonStyles({
  variant = "default",
  size = "default",
  className,
}: Appearance = {}) {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-[9px] border font-semibold leading-5 transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:border-slate-300 disabled:bg-slate-100 disabled:text-slate-600 disabled:shadow-none [&_svg]:size-4 [&_svg]:shrink-0",
    tones[variant],
    sizes[size],
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
