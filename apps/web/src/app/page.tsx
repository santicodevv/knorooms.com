import { headers } from "next/headers";
import { Building2, Globe, Lock, Server, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { normalizeBaseDomain, normalizePlatformSubdomain } from "@/lib/tenancy/host";

export default async function PublicHomePage() {
  const incomingHeaders = await headers();
  const rawHost =
    incomingHeaders.get("x-forwarded-host") ?? incomingHeaders.get("host") ?? "localhost:3000";
  const proto = incomingHeaders.get("x-forwarded-proto") ?? "http";
  const portPart = rawHost.includes(":") ? `:${rawHost.split(":")[1]}` : "";

  const baseDomain = normalizeBaseDomain();
  const platformSubdomain = normalizePlatformSubdomain();
  const adminUrl = `${proto}://${platformSubdomain}.${baseDomain}${portPart}`;
  const sampleTenantPattern = `${proto}://<slug>.${baseDomain}${portPart}`;

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-slate-900 font-bold text-white">
              K
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-slate-900">KNOROOMS</span>
              <span className="ml-2 rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                República Dominicana
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button asChild variant="outline" size="sm">
              <a href={adminUrl}>Consola de Plataforma ({platformSubdomain})</a>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-10 px-6 py-12">
        <section className="space-y-4">
          <Badge variant="secondary">Arquitectura SaaS Multi-Tenant Aislada por Host</Badge>
          <h1 className="max-w-3xl text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Infraestructura de Gestión Académica e Institucional para Centros Educativos
          </h1>
          <p className="max-w-3xl text-base leading-relaxed text-slate-600">
            KNOROOMS provee entornos institucionales dedicados por subdominio con aislamiento
            estricto de sesiones, control de acceso basado en roles y auditoría de soporte temporal
            mediante Backend-for-Frontend (BFF) con sesiones cifradas en el servidor.
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button asChild>
              <a href={adminUrl}>Acceder a Administración Global</a>
            </Button>
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader>
              <div className="mb-1 flex items-center gap-2 text-slate-700">
                <Globe className="size-4" />
                <span className="text-xs font-semibold tracking-wider uppercase">Dominio Raíz</span>
              </div>
              <CardTitle>Sitio Público</CardTitle>
              <CardDescription className="font-mono text-xs">
                {proto}://{baseDomain}
                {portPart}
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-slate-600">
              Punto de entrada informativo sin exposición de endpoints administrativos ni datos de
              instituciones.
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="mb-1 flex items-center gap-2 text-slate-700">
                <Server className="size-4" />
                <span className="text-xs font-semibold tracking-wider uppercase">
                  Gobierno de Plataforma
                </span>
              </div>
              <CardTitle>Administración Global</CardTitle>
              <CardDescription className="font-mono text-xs">{adminUrl}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-slate-600">
              <p>
                Alta de nuevas instituciones educativas, suspensión/activación operativa, asignación
                de administradores iniciales y solicitudes auditadas de soporte.
              </p>
              <Button asChild variant="outline" size="sm" className="w-full">
                <a href={adminUrl}>
                  Abrir {platformSubdomain}.{baseDomain}
                </a>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="mb-1 flex items-center gap-2 text-slate-700">
                <Building2 className="size-4" />
                <span className="text-xs font-semibold tracking-wider uppercase">
                  Tenancy Institucional
                </span>
              </div>
              <CardTitle>Portal de Colegio</CardTitle>
              <CardDescription className="font-mono text-xs">{sampleTenantPattern}</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-slate-600">
              Cada colegio opera en su propio subdominio (<code className="font-mono">slug</code>)
              con cookies de sesión <code className="font-mono">HttpOnly</code> host-only y
              validación explícita de membresía activa o concesión temporal de soporte.
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-5 text-slate-800" />
                <CardTitle>Seguridad BFF con sesiones cifradas</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-slate-600">
              <p>
                El navegador nunca almacena ni recibe{" "}
                <code className="font-mono">access_token</code> ni{" "}
                <code className="font-mono">refresh_token</code>.
              </p>
              <p>
                Los tokens se almacenan en Redis cifrados con <strong>AES-256-GCM</strong> y se
                renuevan automáticamente en el servidor cuando restan menos de 60 segundos de
                vigencia.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Lock className="size-5 text-slate-800" />
                <CardTitle>Aislamiento por Subdominio y Protección CSRF</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-slate-600">
              <p>
                Toda operación mutante (<code className="font-mono">POST</code>,{" "}
                <code className="font-mono">PUT</code>, <code className="font-mono">PATCH</code>,{" "}
                <code className="font-mono">DELETE</code>) exige validación en tiempo constante de{" "}
                <code className="font-mono">X-CSRF-Token</code> y coincidencia estricta de cabecera{" "}
                <code className="font-mono">Origin</code> contra el host activo.
              </p>
            </CardContent>
          </Card>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
        KNOROOMS · Plataforma SaaS Multi-Tenant de Gestión Académica · República Dominicana
      </footer>
    </div>
  );
}
