import { headers } from "next/headers";
import { Server } from "lucide-react";
import { LogoutButton } from "@/components/auth/logout-button";
import { PlatformConsole } from "@/components/platform/platform-console";
import { Badge } from "@/components/ui/badge";
import { LoginFormCard } from "@/features/auth/components/login-form-card";
import { serverApiFetch } from "@/lib/api/server-api";
import type { InstitutionDto, MeResponseDto } from "@/lib/api/types";
import { getServerSession } from "@/lib/auth/session-store";
import { normalizeBaseDomain } from "@/lib/tenancy/host";

export default async function PlatformAdministrationPage() {
  const incomingHeaders = await headers();
  const rawHost =
    incomingHeaders.get("x-forwarded-host") ??
    incomingHeaders.get("host") ??
    "admin.localhost:3000";
  const proto = incomingHeaders.get("x-forwarded-proto") ?? "http";
  const portSuffix = rawHost.includes(":") ? `:${rawHost.split(":")[1]}` : "";
  const baseDomain = normalizeBaseDomain();

  const session = await getServerSession();

  if (!session) {
    return (
      <LoginFormCard
        title="Consola de Administración Global"
        description="Inicie sesión con su cuenta de operador de plataforma para gestionar las instituciones educativas registradas en KNOROOMS."
        returnTo="/"
        hostLabel={rawHost}
      />
    );
  }

  const [meResult, institutionsResult] = await Promise.all([
    serverApiFetch<MeResponseDto>("/api/me"),
    serverApiFetch<InstitutionDto[]>("/api/platform/institutions"),
  ]);

  const platformRoles = meResult.ok ? meResult.data.platformRoles : [];

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-slate-900 text-white">
              <Server className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-slate-900">
                  KNOROOMS · Administración Global
                </h1>
                <Badge variant="secondary" className="font-mono text-xs">
                  {rawHost}
                </Badge>
              </div>
              <p className="text-xs text-slate-500">
                Gobierno multi-tenant de instituciones educativas y soporte técnico auditado
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-sm font-medium text-slate-900">
                {meResult.ok ? meResult.data.displayName : session.user.name}
              </div>
              <div className="flex items-center justify-end gap-1.5 text-xs text-slate-500">
                <span>{meResult.ok ? meResult.data.email : session.user.email}</span>
                {platformRoles.map((role) => (
                  <Badge key={role} variant="outline" className="text-[10px]">
                    {role}
                  </Badge>
                ))}
              </div>
            </div>
            <LogoutButton csrfToken={session.csrfToken} />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-8">
        <PlatformConsole
          initialInstitutions={institutionsResult.ok ? institutionsResult.data : []}
          initialProblem={institutionsResult.ok ? null : institutionsResult.problem}
          csrfToken={session.csrfToken}
          baseDomain={baseDomain}
          portSuffix={portSuffix}
          proto={proto}
        />
      </main>
    </div>
  );
}
