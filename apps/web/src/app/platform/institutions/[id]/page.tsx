import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { PlatformDetailShell } from "@/features/platform/components/platform-detail-shell";
import { InstitutionDetails } from "@/features/platform/components/institution-details";
import { LoginFormCard } from "@/features/auth/components/login-form-card";
import { ProblemAlert } from "@/components/api/problem-alert";
import type { InstitutionSetup } from "@/features/platform/schemas/institution-setup-schemas";
import type {
  ModuleSettings,
  ProductModule,
} from "@/features/platform/schemas/institution-management-schemas";
import { serverApiFetch } from "@/lib/api/server-api";
import { getServerSession } from "@/lib/auth/session-store";
import { normalizeBaseDomain } from "@/lib/tenancy/host";
import { sanitizeReturnTo } from "@/lib/auth/return-to";
export default async function InstitutionDetailsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string; back?: string }>;
}) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const session = await getServerSession();
  if (!session)
    return (
      <LoginFormCard
        title="Administración de colegios"
        description="Inicie sesión para consultar esta institución."
        returnTo={`/institutions/${id}`}
        hostLabel="Administración global"
      />
    );
  const [setup, modules, catalog] = await Promise.all([
    serverApiFetch<InstitutionSetup>(`/api/platform/institutions/${id}/setup`),
    serverApiFetch<ModuleSettings>(`/api/platform/institution-management/${id}/modules`),
    serverApiFetch<ProductModule[]>("/api/platform/product-modules"),
  ]);
  const query = await searchParams;
  const tab = ["summary", "information", "modules", "administrator"].includes(query.tab ?? "")
    ? query.tab!
    : "summary";
  const back = sanitizeReturnTo(query.back ?? null, "/institutions");
  const incoming = await headers();
  const host = incoming.get("x-forwarded-host") ?? incoming.get("host") ?? "";
  const port = host.match(/:\d+$/)?.[0] ?? "";
  const proto = incoming.get("x-forwarded-proto") ?? "http";
  return (
    <PlatformDetailShell
      name={session.user.name}
      email={session.user.email}
      csrfToken={session.csrfToken}
    >
      {!setup.ok ? (
        <ProblemAlert problem={setup.problem} />
      ) : !modules.ok ? (
        <ProblemAlert problem={modules.problem} />
      ) : !catalog.ok ? (
        <ProblemAlert problem={catalog.problem} />
      ) : (
        <InstitutionDetails
          key={id}
          initial={setup.data}
          modules={modules.data}
          catalog={catalog.data}
          csrfToken={session.csrfToken}
          initialTab={tab}
          back={back}
          portalUrl={`${proto}://${setup.data.profile.slug}.${normalizeBaseDomain()}${port}`}
        />
      )}
    </PlatformDetailShell>
  );
}
