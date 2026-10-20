"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { submitLogin } from "@/features/auth/api/auth-api";
import { loginSchema, type LoginFormValues } from "@/features/auth/schemas/auth-schemas";
import type { ProblemDetails } from "@/lib/api/types";

interface UseLoginFormParams {
  returnTo: string;
}

export function useLoginForm({ returnTo }: UseLoginFormParams) {
  const [problem, setProblem] = useState<ProblemDetails | null>(null);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: LoginFormValues) {
    setProblem(null);
    const result = await submitLogin({
      email: values.email,
      password: values.password,
      returnTo,
    });

    if (result.ok) {
      window.location.assign(result.data.returnTo || "/");
      return;
    }

    setProblem(result.problem);
  }

  return {
    form,
    problem,
    onSubmit,
  };
}
