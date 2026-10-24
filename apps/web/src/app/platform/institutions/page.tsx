import { headers } from "next/headers";
import { InstitutionDirectory } from "@/features/platform/components/institution-directory";
import {
  readDirectoryFilters,
  directoryQuery,
  type InstitutionPage,
} from "@/features/platform/schemas/institution-management-schemas";
import { PlatformDetailShell } from "@/features/platform/components/platform-detail-shell";
import { LoginFormCard } from "@/features/auth/components/login-form-card";
import { serverApiFetch } from "@/lib/api/server-api";
import type { MeResponseDto } from "@/lib/api/types";
import { getServerSession } from "@/lib/auth/session-store";

export default async function PlatformAdministrationPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const filters = readDirectoryFilters(await searchParams);
  const incomingHeaders = await headers();
  const rawHost =
    incomingHeaders.get("x-forwarded-host") ??
    incomingHeaders.get("host") ??
    "admin.localhost:3000";

  const session = await getServerSession();

  if (!session) {
    return (
      <LoginFormCard
        title="Consola de Administración Global"
        description="Inicie sesión con su cuenta de operador de plataforma para gestionar las instituciones educativas registradas en KNOROOMS."
        returnTo="/institutions"
        hostLabel={rawHost}
      />
    );
  }

  const [meResult, institutionsResult] = await Promise.all([
    serverApiFetch<MeResponseDto>("/api/me"),
    serverApiFetch<InstitutionPage>(
      `/api/platform/institution-management?${directoryQuery(filters)}`,
    ),
  ]);

  const displayName = meResult.ok ? meResult.data.displayName : session.user.name;
  const email = meResult.ok ? meResult.data.email : session.user.email;

  return (
    <PlatformDetailShell name={displayName} email={email} csrfToken={session.csrfToken}>
      <InstitutionDirectory
        initial={
          institutionsResult.ok
            ? institutionsResult.data
            : { items: [], total: 0, page: filters.page, pageSize: filters.pageSize }
        }
        filters={filters}
        initialProblem={institutionsResult.ok ? null : institutionsResult.problem}
        csrfToken={session.csrfToken}
      />
    </PlatformDetailShell>
  );
}
