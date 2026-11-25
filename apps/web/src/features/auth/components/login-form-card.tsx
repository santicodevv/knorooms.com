"use client";

import {
  PlatformLoginFormCard,
  type PlatformLoginFormCardProps,
} from "@/features/auth/components/platform-login-form-card";
import { SchoolLoginForm } from "@/features/auth/components/school-login-form";

export type LoginFormCardProps = PlatformLoginFormCardProps & { variant?: "platform" | "school" };

export function LoginFormCard({ variant = "platform", ...props }: LoginFormCardProps) {
  return variant === "school" ? (
    <SchoolLoginForm returnTo={props.returnTo} />
  ) : (
    <PlatformLoginFormCard {...props} />
  );
}
