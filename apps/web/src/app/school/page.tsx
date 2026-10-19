import { headers } from "next/headers";
import Link from "next/link";
import { Building2, KeyRound, ShieldAlert, ShieldCheck, Users } from "lucide-react";
import { SchoolShell } from "@/components/school/school-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { serverApiFetch } from "@/lib/api/server-api";
import type { TenantContextDto } from "@/lib/api/types";
import { getServerSession } from "@/lib/auth/session-store";
import { resolveHost } from "@/lib/tenancy/host";

export default async function SchoolOverviewPage() {
  const incomingHeaders = await headers();
  const rawHost =
    incomingHeaders.get("x-forwarded-host") ??
    incomingHeaders.get("host") ??
    "colegio.localhost:3000";
  const resolution = resolveHost(rawHost);
  const slug = resolution.kind === "tenant" ? resolution.slug : "";

  const session = await getServerSession();
  const contextResult = session
    ? await serverApiFetch<TenantContextDto>("/api/tenant/context")
    : null;

  return (
    <SchoolShell
      session={session}
      rawHost={rawHost}
      slug={slug}
      returnTo="/"
      activeTab="overview"
      contextResult={contextResult}
    >
      {contextResult && contextResult.ok ? (
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Building2 className="size-5 text-slate-800" />
                  <CardTitle>Información de la Institución</CardTitle>
                </div>
                <CardDescription>
                  Datos del tenant resueltos por el backend a partir de{" "}
                  <code className="font-mono">GET /api/tenant/context</code>.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-500">Nombre oficial</span>
                  <span className="font-medium text-slate-900">
                    {contextResult.data.tenant.name}
                  </span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-500">Subdominio (Slug)</span>
                  <span className="font-mono text-xs font-semibold text-slate-800">
                    {contextResult.data.tenant.slug}
                  </span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-500">Identificador (Tenant ID)</span>
                  <span className="font-mono text-xs text-slate-600">
                    {contextResult.data.tenant.id}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Estado operativo</span>
                  {contextResult.data.tenant.status === "Active" ? (
                    <Badge variant="success">Activa</Badge>
                  ) : (
                    <Badge variant="warning">Suspendida</Badge>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="size-5 text-slate-800" />
                  <CardTitle>Modalidad de Acceso y Roles</CardTitle>
                </div>
                <CardDescription>
                  Vínculo de autorización verificado para la sesión actual.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-500">Tipo de acceso</span>
                  {contextResult.data.accessType === "Support" ? (
                    <Badge variant="warning">Soporte Técnico Temporal (Support)</Badge>
                  ) : (
                    <Badge variant="default">Miembro Institucional (Member)</Badge>
                  )}
                </div>
                {contextResult.data.membershipId ? (
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-slate-500">ID de Membresía</span>
                    <span className="font-mono text-xs text-slate-600">
                      {contextResult.data.membershipId}
                    </span>
                  </div>
                ) : null}
                {contextResult.data.supportAccessExpiresAt ? (
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-slate-500">Expiración de soporte</span>
                    <span className="font-mono text-xs font-medium text-amber-800">
                      {new Date(contextResult.data.supportAccessExpiresAt).toLocaleString("es-DO")}
                    </span>
                  </div>
                ) : null}
                <div className="space-y-1.5 pt-1">
                  <span className="text-xs font-medium text-slate-500">
                    Roles asignados en la institución
                  </span>
                  {contextResult.data.roles.length === 0 ? (
                    <p className="text-xs text-slate-400">
                      Sin roles institucionales directos (acceso por concesión de soporte).
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {contextResult.data.roles.map((role) => (
                        <Badge key={role.id} variant="secondary">
                          {role.name} ({role.code})
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <KeyRound className="size-5 text-slate-800" />
                <CardTitle>Permisos Efectivos en la Sesión Actual</CardTitle>
              </div>
              <CardDescription>
                Permisos autorizados por el backend para ejecutar operaciones en{" "}
                <strong>{contextResult.data.tenant.name}</strong>.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {contextResult.data.permissions.length === 0 ? (
                <p className="text-sm text-slate-500">
                  No se reportaron permisos específicos en el contexto actual.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {contextResult.data.permissions.map((permission) => (
                    <Badge
                      key={permission}
                      variant="outline"
                      className="font-mono text-xs text-slate-800"
                    >
                      {permission}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Users className="size-5 text-slate-800" />
                  <CardTitle>Directorio de Miembros Institucionales</CardTitle>
                </div>
                <CardDescription>
                  Consulte los usuarios con membresía en el colegio y revoque accesos cuando sea
                  necesario.
                </CardDescription>
              </CardHeader>
              <CardFooter>
                <Button asChild variant="outline">
                  <Link href="/members">Gestionar miembros (/members)</Link>
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <ShieldAlert className="size-5 text-slate-800" />
                  <CardTitle>Solicitudes de Acceso Temporal de Soporte</CardTitle>
                </div>
                <CardDescription>
                  Apruebe, rechace o revoque en cualquier momento el acceso temporal del equipo de
                  soporte de KNOROOMS.
                </CardDescription>
              </CardHeader>
              <CardFooter>
                <Button asChild variant="outline">
                  <Link href="/support-access">Gestionar soporte (/support-access)</Link>
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      ) : null}
    </SchoolShell>
  );
}
