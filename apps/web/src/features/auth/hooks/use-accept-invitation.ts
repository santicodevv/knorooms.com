"use client";
import toast from "react-hot-toast";
import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { ProblemDetails } from "@/lib/api/types";
import { acceptInvitationSchema, type AcceptInvitationValues } from "../schemas/invitation-schema";
import { acceptInvitation } from "../api/accept-invitation-api";
export function useAcceptInvitation() {
  const [done, setDone] = useState(false);
  const [problem, setProblem] = useState<ProblemDetails | null>(null);
  const form = useForm<AcceptInvitationValues>({
    resolver: zodResolver(acceptInvitationSchema),
    defaultValues: { invitationId: "", token: "", displayName: "", password: "" },
  });
  const [idValue, tokenValue] = useWatch({
    control: form.control,
    name: ["invitationId", "token"],
  });
  const validLink = /^[0-9a-f-]{36}$/i.test(idValue) && /^[A-Fa-f0-9]{64}$/.test(tokenValue);
  useEffect(() => {
    const hash = window.location.hash;
    if (!hash) return;
    const values = new URLSearchParams(hash.slice(1));
    const id = values.get("id") ?? "";
    const token = values.get("token") ?? "";
    form.setValue("invitationId", id);
    form.setValue("token", token);
    window.history.replaceState(null, "", window.location.pathname);
  }, [form]);
  const submit = form.handleSubmit(async (values) => {
    setProblem(null);
    const error = await acceptInvitation(values);
    if (error) {
      setProblem(error);
      toast.error(error.detail ?? error.title ?? "No se pudo activar la cuenta.");
      return;
    }
    form.reset();
    setDone(true);
    toast.success("Acceso activado. Ya puede iniciar sesión en su colegio.");
  });
  return { form, validLink, done, problem, submit };
}
