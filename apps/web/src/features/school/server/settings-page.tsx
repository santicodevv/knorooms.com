import { serverApiFetch } from "@/lib/api/server-api";
import type { RoleDto } from "@/lib/api/types";
import {
  RolePermissionsEditor,
  type EditablePermission,
} from "../components/role-permissions-editor";
import Link from "next/link";
import { SchoolShell } from "@/components/school/school-shell";
import { Badge } from "@/components/ui/badge";
import { SchoolPageHeading, SchoolPanel } from "../components/school-ui";
import { getSchoolContext, getSchoolCapabilities } from "./school-context";
export async function SchoolSettingsPage({ moodle = false }: { moodle?: boolean }) {
  const data = await getSchoolContext(),
    context = data.contextResult?.ok ? data.contextResult.data : null;
  const capabilities = context ? await getSchoolCapabilities() : null;
  const canEditRoles =
    !moodle &&
    context?.roles.some((role) => role.code === "InstitutionAdmin") &&
    context.permissions.includes("institution.roles.manage");
  const [roles, catalog] = canEditRoles
    ? await Promise.all([
        serverApiFetch<RoleDto[]>("/api/tenant/roles"),
        serverApiFetch<EditablePermission[]>("/api/tenant/roles/permissions"),
      ])
    : [null, null];
  return (
    <SchoolShell
      {...data}
      activeTab={moodle ? "moodle" : "settings"}
      returnTo={moodle ? "/moodle" : "/settings"}
    >
      {context && (
        <>
          <SchoolPageHeading
            title={moodle ? "Integración Moodle" : "Configuración"}
            description={
              moodle
                ? "Una próxima integración para conectar las herramientas del colegio."
                : "Información institucional, acceso y reglas académicas."
            }
          />
          {moodle ? (
            <SchoolPanel title="Moodle · Próximamente">
              <div className="text-muted space-y-3 p-6 text-sm leading-7">
                <p>La conexión con Moodle todavía no está disponible en esta versión.</p>
                <p>
                  Cuando esté habilitada, cada colegio tendrá su propia configuración. La gestión
                  escolar actual continúa dentro de KNOROOMS.
                </p>
                <Badge variant="secondary">No disponible</Badge>
              </div>
            </SchoolPanel>
          ) : (
            <div className="space-y-5">
              <SchoolPanel title="Información del colegio">
                <dl className="grid gap-6 p-6 text-sm sm:grid-cols-2">
                  {[
                    ["Institución", context.tenant.name],
                    ["Subdominio", context.tenant.slug],
                    ["Estado", context.tenant.status === "Active" ? "Activa" : "Suspendida"],
                    ["Usuario", data.session?.user.name ?? ""],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <dt className="text-muted text-xs">{label}</dt>
                      <dd className="mt-2 font-semibold text-slate-800">{value}</dd>
                    </div>
                  ))}
                </dl>
              </SchoolPanel>
              <SchoolPanel
                title="Acceso y módulos"
                description="Los módulos se habilitan desde la administración global."
              >
                <div className="flex flex-wrap gap-3 p-6">
                  {capabilities?.ok ? (
                    capabilities.data.modules.map((m) => (
                      <Badge
                        key={m.code}
                        variant={m.canWrite ? "success" : m.canRead ? "warning" : "secondary"}
                      >
                        {m.name} ·{" "}
                        {m.canWrite ? "Habilitado" : m.canRead ? "Solo consulta" : "No habilitado"}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-muted text-xs">No se pudieron consultar los módulos.</p>
                  )}
                  <Badge variant="secondary">Moodle · Próximamente</Badge>
                </div>
                <div className="border-t border-slate-200 p-6">
                  <p className="text-muted mb-3 text-xs">
                    Tu acceso institucional está determinado por los roles asignados.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {context.roles.map((role) => (
                      <Badge key={role.id}>{role.name}</Badge>
                    ))}
                  </div>
                </div>
              </SchoolPanel>
              {canEditRoles && data.session && (
                <SchoolPanel title="Permisos de los roles">
                  {roles?.ok && catalog?.ok ? (
                    roles.data
                      .filter((role) => role.code !== "Guardian")
                      .map((role) => (
                        <RolePermissionsEditor
                          key={role.id}
                          role={role}
                          catalog={catalog.data}
                          actorPermissions={context.permissions}
                          csrfToken={data.session!.csrfToken}
                        />
                      ))
                  ) : (
                    <p className="p-4 text-sm">No se pudo cargar el catálogo de permisos.</p>
                  )}
                </SchoolPanel>
              )}
              {context.permissions.includes("institution.grading.read") && (
                <SchoolPanel title="Reglas académicas">
                  <Link
                    className="block p-6 text-sm font-semibold text-blue-700 hover:bg-blue-50"
                    href="/settings/policies"
                  >
                    Políticas de evaluación →
                  </Link>
                </SchoolPanel>
              )}
            </div>
          )}
        </>
      )}
    </SchoolShell>
  );
}
