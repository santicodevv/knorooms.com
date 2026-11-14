"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { updateSchoolRolePermissions } from "../api/school-api";
import type { RoleDto } from "@/lib/api/types";

export type EditablePermission = { code: string; name: string; description: string };

const requiredAdminPermissions = new Set([
  "institution.context.read",
  "institution.roles.read",
  "institution.roles.manage",
]);

export function RolePermissionsEditor({
  role,
  catalog,
  actorPermissions,
  csrfToken,
}: {
  role: RoleDto;
  catalog: EditablePermission[];
  actorPermissions: string[];
  csrfToken: string;
}) {
  const router = useRouter();
  const [feedback, setFeedback] = useState<{ text: string; error: boolean }>();
  const [saving, setSaving] = useState(false);
  const isAdminRole = role.code === "InstitutionAdmin";

  async function save(form: FormData) {
    setSaving(true);
    setFeedback(undefined);
    const selected = form.getAll("permissions").map(String);
    const result = await updateSchoolRolePermissions(role.id, selected, csrfToken);
    setSaving(false);
    setFeedback(
      result.ok
        ? { text: "Permisos guardados.", error: false }
        : {
            text:
              result.problem.detail ??
              result.problem.title ??
              "No se pudieron guardar los permisos.",
            error: true,
          },
    );
    if (result.ok) router.refresh();
  }

  return (
    <details className="border-b border-slate-200 p-4 last:border-b-0">
      <summary className="cursor-pointer text-sm font-semibold">{role.name}</summary>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void save(new FormData(event.currentTarget));
        }}
        className="mt-4 space-y-4"
      >
        <fieldset disabled={saving} className="grid gap-3 sm:grid-cols-2">
          <legend className="mb-2 text-sm font-medium">Permisos</legend>
          {catalog.map((permission) => {
            const assigned = role.permissions.includes(permission.code);
            const required = isAdminRole && requiredAdminPermissions.has(permission.code);
            const unavailable =
              !assigned && !isAdminRole && !actorPermissions.includes(permission.code);
            return (
              <label key={permission.code} className="flex items-start gap-2 text-sm">
                {required && <input type="hidden" name="permissions" value={permission.code} />}
                <input
                  type="checkbox"
                  name="permissions"
                  value={permission.code}
                  defaultChecked={assigned || required}
                  disabled={required || unavailable}
                  className="mt-1"
                />
                <span>
                  {permission.name}
                  <span className="text-muted block text-xs">{permission.description}</span>
                </span>
              </label>
            );
          })}
        </fieldset>
        <button
          className="rounded bg-blue-700 px-4 py-2 text-sm text-white disabled:opacity-50"
          disabled={saving}
        >
          {saving ? "Guardando…" : "Guardar permisos"}
        </button>
        {feedback && (
          <p role={feedback.error ? "alert" : "status"} className="text-sm">
            {feedback.text}
          </p>
        )}
      </form>
    </details>
  );
}
