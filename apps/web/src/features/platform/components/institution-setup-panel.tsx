"use client";
import Link from "next/link";
import { FeedbackBanner } from "@/components/shared/feedback-banner";
import { SectionCard } from "@/components/shared/section-card";
import { RefreshButton } from "@/components/shared/refresh-button";
import { InstitutionStatusBadge } from "@/components/shared/status-badge";
import { useInstitutionSetup } from "../hooks/use-institution-setup";
import type { InstitutionSetup } from "../schemas/institution-setup-schemas";
import { InstitutionProfileForm } from "./institution-profile-form";
import { AdministratorInvitationsCard } from "./administrator-invitations-card";
export function InstitutionSetupPanel({
  initial,
  csrfToken,
}: {
  initial: InstitutionSetup;
  csrfToken: string;
}) {
  const state = useInstitutionSetup(initial, csrfToken);
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <Link href="/" className="text-sm text-slate-500 hover:underline">
            ← Colegios
          </Link>
          <h1 className="mt-2 text-2xl font-semibold">{state.data.profile.name}</h1>
          <p className="text-sm text-slate-500">Subdominio: {state.data.profile.slug}</p>
        </div>
        <InstitutionStatusBadge status={state.data.profile.status} />
      </div>
      <FeedbackBanner
        problem={state.problem}
        successTitle="Operación completada"
        successMessage={state.success}
      />
      <SectionCard
        title="Preparación administrativa"
        description="Este porcentaje corresponde a la configuración inicial; no acredita preparación académica ni conexión con Moodle."
        headerAction={<RefreshButton onClick={state.refresh} loading={state.busy} />}
      >
        <div className="mb-3 text-3xl font-semibold">{state.data.progressPercent}%</div>
        <progress
          aria-label="Preparación administrativa"
          max={100}
          value={state.data.progressPercent}
          className="h-2 w-full accent-emerald-600"
        />
        <ul className="mt-4 grid gap-2 md:grid-cols-2">
          {state.data.tasks.map((task) => (
            <li key={task.code} className="text-sm">
              {task.completed ? "✓" : "○"} {task.label}
            </li>
          ))}
        </ul>
      </SectionCard>
      <InstitutionProfileForm form={state.profileForm} onSubmit={state.save} busy={state.busy} />
      <AdministratorInvitationsCard
        data={state.data}
        form={state.inviteForm}
        busy={state.busy}
        onInvite={state.invite}
        onRevoke={state.revoke}
      />
      <SectionCard title="Suscripción y módulos">
        <Link
          href={`/institutions/${state.data.profile.id}/subscription`}
          className="text-sm underline"
        >
          Administrar plan, vigencia, límites y módulos
        </Link>
      </SectionCard>
      <div className="grid gap-4">
        {[["Moodle", "Pendiente · conexión propia y sincronización revisable."]].map(
          ([title, text]) => (
            <SectionCard key={title} title={title}>
              <p className="text-sm text-slate-500">{text}</p>
            </SectionCard>
          ),
        )}
      </div>
      <SectionCard title="Soporte">
        <p className="text-sm text-slate-600">
          El acceso a los datos del colegio requiere una concesión temporal autorizada.
        </p>
        <Link href="/#support-access" className="mt-2 inline-block text-sm underline">
          Ir a las solicitudes de soporte
        </Link>
      </SectionCard>
    </div>
  );
}
