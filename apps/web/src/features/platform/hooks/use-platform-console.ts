"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  assignPlatformInitialAdministrator,
  createPlatformInstitution,
  fetchPlatformInstitutions,
  requestPlatformSupportAccess,
  togglePlatformInstitutionStatus,
} from "@/features/platform/api/platform-api";
import {
  assignAdminSchema,
  createInstitutionSchema,
  supportAccessRequestSchema,
  type AssignAdminFormValues,
  type CreateInstitutionFormValues,
  type SupportAccessRequestFormValues,
} from "@/features/platform/schemas/platform-schemas";
import type { InstitutionDto, ProblemDetails } from "@/lib/api/types";

interface UsePlatformConsoleParams {
  initialInstitutions: InstitutionDto[];
  initialProblem: ProblemDetails | null;
  csrfToken: string;
}

export function usePlatformConsole({
  initialInstitutions,
  initialProblem,
  csrfToken,
}: UsePlatformConsoleParams) {
  const router = useRouter();
  const [institutions, setInstitutions] = useState<InstitutionDto[]>(initialInstitutions);
  const [listProblem, setListProblem] = useState<ProblemDetails | null>(initialProblem);
  const [actionProblem, setActionProblem] = useState<ProblemDetails | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [busyInstitutionId, setBusyInstitutionId] = useState<string | null>(null);
  const [refreshingList, setRefreshingList] = useState(false);

  const createForm = useForm<CreateInstitutionFormValues>({
    resolver: zodResolver(createInstitutionSchema),
    defaultValues: {
      name: "",
      slug: "",
    },
  });

  const assignAdminForm = useForm<AssignAdminFormValues>({
    resolver: zodResolver(assignAdminSchema),
    defaultValues: {
      institutionId: initialInstitutions[0]?.id ?? "",
      email: "",
    },
  });

  const supportForm = useForm<SupportAccessRequestFormValues>({
    resolver: zodResolver(supportAccessRequestSchema),
    defaultValues: {
      tenantId: initialInstitutions[0]?.id ?? "",
      reason: "",
      permissions: ["institution.members.read"],
      durationMinutes: 240,
    },
  });

  const selectedPermissions =
    useWatch({
      control: supportForm.control,
      name: "permissions",
    }) ?? [];

  async function refreshInstitutions() {
    setRefreshingList(true);
    setListProblem(null);
    const result = await fetchPlatformInstitutions();
    setRefreshingList(false);

    if (result.ok) {
      setInstitutions(result.data);
      router.refresh();
    } else {
      setListProblem(result.problem);
    }
  }

  async function onCreateInstitution(values: CreateInstitutionFormValues) {
    setActionProblem(null);
    setActionSuccess(null);

    const result = await createPlatformInstitution(values, csrfToken);
    if (!result.ok) {
      setActionProblem(result.problem);
      return;
    }

    const created = result.data;
    setInstitutions((prev) => [created, ...prev]);
    if (!assignAdminForm.getValues("institutionId")) {
      assignAdminForm.setValue("institutionId", created.id);
    }
    if (!supportForm.getValues("tenantId")) {
      supportForm.setValue("tenantId", created.id);
    }
    createForm.reset();
    setActionSuccess(`Institución "${created.name}" (${created.slug}) registrada exitosamente.`);
    router.refresh();
  }

  async function handleToggleInstitutionStatus(institution: InstitutionDto) {
    setActionProblem(null);
    setActionSuccess(null);
    setBusyInstitutionId(institution.id);

    const action = institution.status === "Active" ? "suspend" : "activate";
    const result = await togglePlatformInstitutionStatus(institution.id, action, csrfToken);
    setBusyInstitutionId(null);

    if (!result.ok) {
      setActionProblem(result.problem);
      return;
    }

    const nextStatus = institution.status === "Active" ? "Suspended" : "Active";
    setInstitutions((prev) =>
      prev.map((item) => (item.id === institution.id ? { ...item, status: nextStatus } : item)),
    );
    setActionSuccess(
      nextStatus === "Active"
        ? `Institución "${institution.name}" activada correctamente.`
        : `Institución "${institution.name}" suspendida correctamente.`,
    );
    router.refresh();
  }

  async function onAssignAdministrator(values: AssignAdminFormValues) {
    setActionProblem(null);
    setActionSuccess(null);

    const result = await assignPlatformInitialAdministrator(
      values.institutionId,
      values.email,
      csrfToken,
    );

    if (!result.ok) {
      setActionProblem(result.problem);
      return;
    }

    assignAdminForm.reset({
      institutionId: values.institutionId,
      email: "",
    });
    setActionSuccess(
      `Administrador institucional (${result.data.email ?? values.email}) vinculado exitosamente (Membresía: ${result.data.membershipId}).`,
    );
  }

  async function onRequestSupportAccess(values: SupportAccessRequestFormValues) {
    setActionProblem(null);
    setActionSuccess(null);

    const result = await requestPlatformSupportAccess(values, csrfToken);
    if (!result.ok) {
      setActionProblem(result.problem);
      return;
    }

    supportForm.reset({
      tenantId: values.tenantId,
      reason: "",
      permissions: ["institution.members.read"],
      durationMinutes: 240,
    });
    setActionSuccess(
      `Solicitud de soporte #${result.data.id} creada en estado "${result.data.status}". Requiere aprobación del colegio antes de habilitar el acceso.`,
    );
  }

  function togglePermissionSelection(code: string) {
    const current = supportForm.getValues("permissions") ?? [];
    const next = current.includes(code)
      ? current.filter((item) => item !== code)
      : [...current, code];
    supportForm.setValue("permissions", next, { shouldValidate: true });
  }

  return {
    institutions,
    listProblem,
    actionProblem,
    actionSuccess,
    busyInstitutionId,
    refreshingList,
    createForm,
    assignAdminForm,
    supportForm,
    selectedPermissions,
    refreshInstitutions,
    onCreateInstitution,
    handleToggleInstitutionStatus,
    onAssignAdministrator,
    onRequestSupportAccess,
    togglePermissionSelection,
  };
}
