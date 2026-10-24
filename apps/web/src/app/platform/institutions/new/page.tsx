import { headers } from "next/headers";
import { PlatformDetailShell } from "@/features/platform/components/platform-detail-shell";
import { InstitutionWizard } from "@/features/platform/components/institution-wizard";
import { LoginFormCard } from "@/features/auth/components/login-form-card";
import { ProblemAlert } from "@/components/api/problem-alert";
import { serverApiFetch } from "@/lib/api/server-api";
import { getServerSession } from "@/lib/auth/session-store";
import { normalizeBaseDomain } from "@/lib/tenancy/host";
import { sanitizeReturnTo } from "@/lib/auth/return-to";
import type { ProductModule } from "@/features/platform/schemas/institution-management-schemas";
export default async function NewInstitutionPage({
  searchParams,
}: {
  searchParams: Promise<{ back?: string }>;
}) {
  const session = await getServerSession();
  if (!session)
    return (
      <LoginFormCard
        title="Crear institución"
        description="Inicie sesión para registrar un colegio."
        returnTo="/institutions/new"
        hostLabel="Administración global"
      />
    );
  const result = await serverApiFetch<ProductModule[]>("/api/platform/product-modules");
  const incoming = await headers();
  const host = incoming.get("x-forwarded-host") ?? incoming.get("host") ?? "";
  const port = host.match(/:\d+$/)?.[0] ?? "";
  const domain = normalizeBaseDomain() + port;
  const back = sanitizeReturnTo((await searchParams).back ?? null, "/institutions");
  return (
    <PlatformDetailShell
      name={session.user.name}
      email={session.user.email}
      csrfToken={session.csrfToken}
    >
      {result.ok ? (
        <InstitutionWizard
          catalog={result.data}
          csrfToken={session.csrfToken}
          domain={domain}
          back={back}
        />
      ) : (
        <ProblemAlert problem={result.problem} />
      )}
    </PlatformDetailShell>
  );
}
