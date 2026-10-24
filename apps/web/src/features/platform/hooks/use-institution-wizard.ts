"use client";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { checkInstitutionSlug, provisionInstitution } from "../api/institution-management-api";
import {
  provisionDefaults,
  provisionSchema,
  type ProvisionValues,
} from "../schemas/institution-management-schemas";
import { useUnsavedChanges } from "./use-unsaved-changes";
export function useInstitutionWizard(csrfToken: string, back: string) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const form = useForm<ProvisionValues>({
    resolver: zodResolver(provisionSchema),
    defaultValues: provisionDefaults,
  });
  const values = useWatch({ control: form.control }) as ProvisionValues;
  const canLeave = useUnsavedChanges(form.formState.isDirty && !saved);
  async function next() {
    if (step === 0) {
      const valid = await form.trigger(
        [
          "name",
          "slug",
          "contactEmail",
          "contactName",
          "phone",
          "address",
          "logoUrl",
          "timeZoneId",
        ],
        { shouldFocus: true },
      );
      if (!valid) return;
      setBusy(true);
      try {
        const result = await checkInstitutionSlug(form.getValues("slug"));
        if (!result.ok) {
          toast.error(result.problem.detail ?? "No se pudo verificar el subdominio.");
          return;
        }
        if (!result.data.available) {
          form.setError(
            "slug",
            { message: "Este subdominio ya está en uso o está reservado." },
            { shouldFocus: true },
          );
          return;
        }
      } finally {
        setBusy(false);
      }
    }
    setStep(Math.min(step + 1, 2));
  }
  const submit = form.handleSubmit(async (body) => {
    setBusy(true);
    const toastId = toast.loading("Creando institución y habilitando módulos…");
    try {
      const result = await provisionInstitution(body, csrfToken);
      if (!result.ok) {
        if (result.status === 409) {
          form.setError("slug", { message: "Este subdominio ya está en uso." });
          setStep(0);
        }
        toast.error(
          result.problem.detail ??
            "No se confirmó el alta. Revise el listado antes de volver a intentar.",
          { id: toastId },
        );
        return;
      }
      setSaved(true);
      toast.success("Institución creada. Ya puede invitar a su administrador.", { id: toastId });
      router.push(`/institutions/${result.data.id}?back=${encodeURIComponent(back)}`);
    } finally {
      setBusy(false);
    }
  });
  function onSubmit(event: FormEvent<HTMLFormElement>) {
    if (step < 2) {
      event.preventDefault();
      void next();
    } else void submit(event);
  }
  return {
    onSubmit,
    goToStep: (index: number) => {
      if (!busy && index >= 0 && index <= step) setStep(index);
    },
    setModules: (modules: string[]) =>
      form.setValue("enabledModules", modules, { shouldDirty: true }),
    form,
    values,
    step,
    busy,
    next,
    previous: () => setStep(Math.max(step - 1, 0)),
    submit,
    cancel: () => {
      if (canLeave()) router.push(back);
    },
  };
}
