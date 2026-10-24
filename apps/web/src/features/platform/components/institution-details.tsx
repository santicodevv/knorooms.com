"use client";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FeedbackBanner } from "@/components/shared/feedback-banner";
import { PlatformPageHeading } from "./platform-page-heading";
import { InstitutionDetailHeader } from "./institution-detail-header";
import { InstitutionDetailTabs } from "./institution-detail-tabs";
import { InstitutionSummary } from "./institution-summary";
import { InstitutionInformation } from "./institution-information";
import { InstitutionAdministrator } from "./institution-administrator";
import { InstitutionModulesEditor } from "./institution-modules-editor";
import { InstitutionStatusDialog } from "./institution-status-dialog";
import { AdministratorInvitationDialog } from "./administrator-invitation-dialog";
import { useInstitutionDetails } from "../hooks/use-institution-details";
import type { InstitutionSetup } from "../schemas/institution-setup-schemas";
import type { ModuleSettings, ProductModule } from "../schemas/institution-management-schemas";
export function InstitutionDetails({
  initial,
  modules,
  catalog,
  csrfToken,
  initialTab,
  back,
  portalUrl,
}: {
  initial: InstitutionSetup;
  modules: ModuleSettings;
  catalog: ProductModule[];
  csrfToken: string;
  initialTab: string;
  back: string;
  portalUrl: string;
}) {
  const s = useInstitutionDetails(initial, csrfToken, initialTab, back);
  const p = s.data.profile;
  return (
    <>
      <PlatformPageHeading
        title="Ficha de institución"
        description="Consulta y administra la configuración del colegio."
        breadcrumb={
          <>
            <button onClick={s.goBack}>Instituciones</button>
            <ChevronRight className="size-3" />
            <strong className="font-semibold text-slate-600">{p.name}</strong>
          </>
        }
        action={
          <Button variant="outline" onClick={s.goBack}>
            <ArrowLeft />
            Volver al listado
          </Button>
        }
      />
      <section className="border-divider rounded-[13px] border bg-white shadow-[0_2px_16px_rgba(20,43,89,0.035)]">
        <InstitutionDetailHeader
          name={p.name}
          status={p.status}
          portalUrl={portalUrl}
          onCopy={() => s.copyPortal(portalUrl)}
          onEdit={s.editInformation}
        />
        <InstitutionDetailTabs tab={s.tab} onChange={s.changeTab} />
        <div className="p-4 sm:p-6">
          <FeedbackBanner problem={s.problem} successMessage={s.success} />
          {s.tab === "summary" ? (
            <InstitutionSummary
              data={s.data}
              modules={modules}
              catalog={catalog}
              portalUrl={portalUrl}
              onTab={s.changeTab}
              onInvite={() => s.setInvite(true)}
            />
          ) : s.tab === "information" ? (
            <InstitutionInformation
              profile={p}
              editing={s.editingInformation}
              form={s.profileForm}
              busy={s.busy}
              onSave={s.save}
              onCancel={s.cancelEditing}
              onEdit={s.editInformation}
              onStatus={() => s.setConfirmStatus(true)}
            />
          ) : s.tab === "modules" ? (
            <InstitutionModulesEditor
              id={p.id}
              initial={modules}
              catalog={catalog}
              csrfToken={csrfToken}
              onDirtyChange={s.setModuleDirty}
              onSaved={s.refreshPage}
            />
          ) : (
            <InstitutionAdministrator data={s.data} onManage={() => s.setInvite(true)} />
          )}
        </div>
      </section>
      {s.invite ? (
        <AdministratorInvitationDialog
          institution={p}
          csrfToken={csrfToken}
          onClose={() => s.setInvite(false)}
          onChanged={s.refreshAll}
        />
      ) : null}
      <InstitutionStatusDialog
        open={s.confirmStatus}
        busy={s.changingStatus}
        name={p.name}
        active={p.status === "Active"}
        onClose={() => s.setConfirmStatus(false)}
        onConfirm={s.toggleStatus}
      />
    </>
  );
}
