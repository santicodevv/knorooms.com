import type { UseFormReturn } from "react-hook-form";
import { Info } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { ProvisionValues } from "../schemas/institution-management-schemas";
function BasicField({
  field,
  label,
  placeholder,
  required = false,
  type = "text",
  form,
  suffix,
}: {
  field: keyof Omit<ProvisionValues, "enabledModules">;
  label: string;
  placeholder: string;
  required?: boolean;
  type?: string;
  form: UseFormReturn<ProvisionValues>;
  suffix?: string;
}) {
  return (
    <div>
      <label
        className="mb-2 block text-[11px] font-semibold text-slate-600"
        htmlFor={`institution-${field}`}
      >
        {label}
        {required ? <span className="ml-1 text-red-700">*</span> : null}
      </label>
      <div
        className={
          suffix
            ? "border-control flex overflow-hidden rounded-[9px] border focus-within:border-blue-600 focus-within:ring-4 focus-within:ring-blue-500/10"
            : ""
        }
      >
        <Input
          id={`institution-${field}`}
          type={type}
          placeholder={placeholder}
          aria-invalid={Boolean(form.formState.errors[field])}
          aria-describedby={form.formState.errors[field] ? `error-${field}` : undefined}
          className={suffix ? "rounded-none border-0 shadow-none focus:ring-0" : ""}
          {...form.register(field)}
        />
        {suffix ? (
          <span className="text-muted flex shrink-0 items-center border-l border-slate-100 bg-slate-50 px-3 text-[11px]">
            .{suffix}
          </span>
        ) : null}
      </div>
      {form.formState.errors[field] ? (
        <p id={`error-${field}`} className="mt-1.5 text-[11px] text-red-600">
          {form.formState.errors[field]?.message}
        </p>
      ) : null}
    </div>
  );
}
export function InstitutionBasicFields({
  form,
  domain,
}: {
  form: UseFormReturn<ProvisionValues>;
  values: ProvisionValues;
  domain: string;
}) {
  return (
    <>
      <h2 className="text-[17px] font-bold tracking-tight">Datos generales de la institución</h2>
      <p className="text-muted mt-2 mb-6 text-xs leading-5">
        Registra la información principal del colegio. Estos datos se pueden modificar después.
      </p>
      <div className="space-y-5">
        <BasicField
          field="name"
          label="Nombre oficial del colegio"
          placeholder="Ej. Colegio Dominicano San Miguel"
          required
          form={form}
        />
        <div>
          <BasicField
            field="slug"
            label="Identificador / Subdominio"
            placeholder="colegio-san-miguel"
            required
            form={form}
            suffix={domain}
          />
          <p className="text-muted mt-2 text-[11px] leading-5">
            Solo minúsculas, números y guiones. Será la dirección del portal del colegio.
          </p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <BasicField
            field="contactEmail"
            label="Correo de contacto institucional"
            placeholder="contacto@colegio.edu.do"
            type="email"
            required
            form={form}
          />
          <BasicField
            field="phone"
            label="Teléfono (opcional)"
            placeholder="809-000-0000"
            type="tel"
            form={form}
          />
        </div>
        <BasicField
          field="address"
          label="Dirección (opcional)"
          placeholder="Ej. Santo Domingo Este, República Dominicana"
          form={form}
        />
        <details className="rounded-[9px] border border-slate-100 p-3">
          <summary className="text-[11px] font-medium text-slate-500">
            Información adicional (opcional)
          </summary>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <BasicField
              field="contactName"
              label="Persona de contacto"
              placeholder="Nombre y apellido"
              form={form}
            />
            <BasicField
              field="timeZoneId"
              label="Zona horaria"
              placeholder="America/Santo_Domingo"
              form={form}
            />
            <BasicField
              field="logoUrl"
              label="Logo: dirección HTTPS"
              placeholder="https://…"
              type="url"
              form={form}
            />
          </div>
        </details>
      </div>
      <p className="mt-5 flex gap-2.5 rounded-[9px] border border-blue-100 bg-blue-50/50 p-3.5 text-[11px] leading-5 text-blue-700">
        <Info className="mt-0.5 size-4 shrink-0" />
        El correo institucional es distinto del administrador inicial. Podrás invitarlo desde la
        ficha o desde su fila en el listado.
      </p>
    </>
  );
}
