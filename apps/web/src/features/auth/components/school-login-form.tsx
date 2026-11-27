"use client";

import { SchoolLoginView } from "@/features/auth/components/school-login-view";
import { useLoginForm } from "@/features/auth/hooks/use-login-form";

export function SchoolLoginForm({ returnTo = "/" }: { returnTo?: string }) {
  const { form, problem, onSubmit, passwordVisible, togglePassword } = useLoginForm({
    returnTo,
    toastError: false,
  });
  return (
    <SchoolLoginView
      register={form.register}
      errors={form.formState.errors}
      busy={form.formState.isSubmitting}
      passwordVisible={passwordVisible}
      onTogglePassword={togglePassword}
      problem={problem}
      onSubmit={form.handleSubmit(onSubmit)}
    />
  );
}
