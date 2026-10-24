"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useInstitutionSetup } from "./use-institution-setup";
import { togglePlatformInstitutionStatus } from "../api/platform-api";
import type { InstitutionSetup } from "../schemas/institution-setup-schemas";
import toast from "react-hot-toast";
import { useUnsavedChanges } from "./use-unsaved-changes";
export function useInstitutionDetails(
  initial: InstitutionSetup,
  csrfToken: string,
  initialTab: string,
  back = "/institutions",
) {
  const router = useRouter();
  const setup = useInstitutionSetup(initial, csrfToken);
  const [editingInformation, setEditingInformation] = useState(false);
  const [tab, setTab] = useState(initialTab);
  const [moduleDirty, setModuleDirty] = useState(false);
  const [invite, setInvite] = useState(false);
  const [confirmStatus, setConfirmStatus] = useState(false);
  const [changingStatus, setChangingStatus] = useState(false);
  const canLeave = useUnsavedChanges(setup.profileForm.formState.isDirty || moduleDirty);
  function changeTab(next: string) {
    if (
      (setup.profileForm.formState.isDirty || moduleDirty) &&
      !window.confirm("Hay cambios sin guardar en la información. ¿Desea cambiar de pestaña?")
    )
      return false;
    setTab(next);
    const url = new URL(window.location.href);
    url.searchParams.set("tab", next);
    window.history.replaceState(null, "", url);
    return true;
  }
  async function toggleStatus() {
    setChangingStatus(true);
    const result = await togglePlatformInstitutionStatus(
      initial.profile.id,
      setup.data.profile.status === "Active" ? "suspend" : "activate",
      csrfToken,
    );
    setChangingStatus(false);
    if (result.ok) {
      toast.success("Estado de la institución actualizado.");
      setConfirmStatus(false);
      await setup.refresh();
      router.refresh();
    } else toast.error(result.problem.detail ?? "No se pudo cambiar el estado.");
  }
  async function copyPortal(url: string) {
    try {
      await navigator.clipboard.writeText(new URL(url).host);
      toast.success("Subdominio copiado.");
    } catch {
      toast.error("No se pudo copiar el subdominio.");
    }
  }
  return {
    editingInformation,
    editInformation: () => {
      if (changeTab("information")) setEditingInformation(true);
    },
    cancelEditing: () => {
      setup.profileForm.reset();
      setEditingInformation(false);
    },
    copyPortal,
    goBack: () => {
      if (canLeave()) router.push(back);
    },
    refreshAll: () => {
      void setup.refresh();
      router.refresh();
    },
    ...setup,
    tab,
    moduleDirty,
    setModuleDirty,
    changeTab,
    invite,
    setInvite,
    confirmStatus,
    setConfirmStatus,
    changingStatus,
    toggleStatus,
    refreshPage: () => router.refresh(),
  };
}
