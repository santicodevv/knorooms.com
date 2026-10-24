"use client";
import { Building2, Plus } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/button";
import { ProblemAlert } from "@/components/api/problem-alert";
import { useInstitutionDirectory } from "../hooks/use-institution-directory";
import { InstitutionDirectoryFilters } from "./institution-directory-filters";
import { InstitutionDirectoryPagination } from "./institution-directory-pagination";
import { InstitutionDirectoryMobile } from "./institution-directory-mobile";
import { InstitutionDirectoryRow } from "./institution-directory-row";
import { PlatformPageHeading } from "./platform-page-heading";
import { AdministratorInvitationDialog } from "./administrator-invitation-dialog";
import type { DirectoryFilters, InstitutionPage } from "../schemas/institution-management-schemas";
import type { ProblemDetails } from "@/lib/api/types";
export function InstitutionDirectory({
  initial,
  filters,
  initialProblem,
  csrfToken,
}: {
  initial: InstitutionPage;
  filters: DirectoryFilters;
  initialProblem: ProblemDetails | null;
  csrfToken: string;
}) {
  const s = useInstitutionDirectory(initial, filters, initialProblem);
  return (
    <>
      <PlatformPageHeading
        title="Instituciones"
        description="Consulta, organiza y configura los colegios de tu plataforma."
        action={
          <ButtonLink size="lg" href={`/institutions/new?back=${encodeURIComponent(s.returnTo)}`}>
            <Plus />
            Nueva institución
          </ButtonLink>
        }
      />
      <section className="border-divider rounded-[13px] border bg-white shadow-[0_2px_16px_rgba(20,43,89,0.035)]">
        <InstitutionDirectoryFilters
          filters={s.filters}
          loading={s.loading}
          onApply={s.apply}
          onRefresh={s.refresh}
        />
        {s.problem ? (
          <div className="px-5 pb-4">
            <ProblemAlert problem={s.problem} />
            <Button variant="outline" className="mt-3" onClick={s.refresh}>
              Reintentar
            </Button>
          </div>
        ) : null}
        <InstitutionDirectoryMobile
          items={s.data.items}
          loading={s.loading}
          onOpen={s.open}
          onInvite={s.setInvite}
        />
        <div className="hidden min-h-40 overflow-x-auto lg:block">
          <table className="w-full text-left text-xs" aria-busy={s.loading}>
            <thead className="border-divider text-muted border-y bg-[#fbfcff] text-[11px] font-bold tracking-wide uppercase">
              <tr>
                {["Institución", "Estado", "Administrador inicial", "Módulos", "Acciones"].map(
                  (text) => (
                    <th key={text} scope="col" className="px-[18px] py-3.5 last:text-right">
                      {text}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f2f7]">
              {s.loading
                ? Array.from({ length: 5 }, (_, index) => (
                    <tr key={index}>
                      <td colSpan={5} className="px-5 py-5">
                        <div className="h-5 animate-pulse rounded bg-slate-100" />
                      </td>
                    </tr>
                  ))
                : s.data.items.map((row) => (
                    <InstitutionDirectoryRow
                      key={row.id}
                      row={row}
                      onOpen={s.open}
                      onInvite={s.setInvite}
                    />
                  ))}
            </tbody>
          </table>
        </div>
        {!s.loading && !s.problem && s.data.items.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <span className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-500">
              <Building2 className="size-6" />
            </span>
            <h2 className="text-sm font-bold">
              {s.hasFilters
                ? "No encontramos instituciones"
                : "Todavía no hay instituciones registradas"}
            </h2>
            <p className="text-muted my-3 text-xs">
              {s.hasFilters
                ? "Prueba con otra búsqueda o ajusta los filtros seleccionados."
                : "Registra el primer colegio y configura sus módulos."}
            </p>
            {s.hasFilters ? (
              <Button
                variant="outline"
                onClick={() => s.apply({ search: "", status: "", administrator: "", page: 1 })}
              >
                Limpiar filtros
              </Button>
            ) : (
              <ButtonLink href="/institutions/new">Nueva institución</ButtonLink>
            )}
          </div>
        ) : null}
        <InstitutionDirectoryPagination
          data={s.data}
          pages={s.pages}
          loading={s.loading}
          onApply={s.apply}
        />
      </section>
      {s.invite ? (
        <AdministratorInvitationDialog
          key={s.invite.id}
          institution={s.invite}
          csrfToken={csrfToken}
          onClose={() => s.setInvite(null)}
          onChanged={s.refresh}
        />
      ) : null}
    </>
  );
}
