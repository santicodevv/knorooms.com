import { z } from "zod";
import type {
  EffectiveAccess,
  ProductModule,
} from "@/features/subscriptions/schemas/subscription-schemas";
export type { ProductModule };
export type InstitutionRow = {
  id: string;
  name: string;
  slug: string;
  status: "Active" | "Suspended";
  contactEmail: string;
  logoUrl: string;
  administratorState: string;
  administratorEmail: string | null;
  invitationId: string | null;
  enabledModules: string[];
};
export type InstitutionPage = {
  items: InstitutionRow[];
  total: number;
  page: number;
  pageSize: number;
};
export type ModuleSettings = {
  enabledModules: string[];
  version: number | null;
  access: EffectiveAccess;
};
export type DirectoryFilters = {
  search: string;
  status: string;
  administrator: string;
  page: number;
  pageSize: number;
};
export const administratorLabels: Record<string, string> = {
  NotActive: "Sin administrador activo",
  None: "Sin administrador",
  Active: "Activo",
  Pending: "Invitación pendiente",
  Expired: "Invitación vencida",
  Failed: "Envío fallido",
};
export const moduleDescriptions: Record<string, string> = {
  students: "Expedientes de estudiantes y vínculos con sus responsables.",
  academic: "Años escolares, grados, secciones, materias y docentes.",
  enrollments: "Inscripción y seguimiento de matrículas por año escolar.",
  attendance: "Registro de presencia, ausencias y tardanzas.",
  grading: "Registro y revisión de calificaciones.",
  reportcards: "Consulta y emisión de resultados académicos.",
  moodle: "Conexión con el aula virtual del colegio.",
};
export const provisionSchema = z.object({
  name: z.string().trim().min(3, "Indique al menos 3 caracteres.").max(160),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9](?:[a-z0-9-]{1,61}[a-z0-9])?$/, "Use letras minúsculas, números y guiones.")
    .refine(
      (v) => !["www", "admin", "api", "app", "auth", "static", "mail"].includes(v),
      "Este subdominio está reservado.",
    ),
  contactEmail: z.string().trim().email("Indique un correo de contacto válido.").max(320),
  contactName: z.string().trim().max(160),
  phone: z.string().trim().max(40),
  address: z.string().trim().max(500),
  logoUrl: z.union([
    z.literal(""),
    z
      .string()
      .url("Indique una URL válida.")
      .startsWith("https://", "Use una URL HTTPS.")
      .max(1000),
  ]),
  timeZoneId: z.string().min(1).max(64),
  enabledModules: z.array(z.string()),
});
export type ProvisionValues = z.infer<typeof provisionSchema>;
export const provisionDefaults: ProvisionValues = {
  name: "",
  slug: "",
  contactEmail: "",
  contactName: "",
  phone: "",
  address: "",
  logoUrl: "",
  timeZoneId: "America/Santo_Domingo",
  enabledModules: [],
};
export function directoryQuery(filters: DirectoryFilters) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters))
    if (String(value)) params.set(key, String(value));
  return params.toString();
}
export function readDirectoryFilters(
  params: Record<string, string | string[] | undefined>,
): DirectoryFilters {
  const raw = (key: string) => (typeof params[key] === "string" ? (params[key] as string) : "");
  return {
    search: raw("search").slice(0, 200),
    status: ["Active", "Suspended"].includes(raw("status")) ? raw("status") : "",
    administrator: Object.hasOwn(administratorLabels, raw("administrator"))
      ? raw("administrator")
      : "",
    page: Math.max(1, Math.min(1000000, Number(raw("page")) || 1)),
    pageSize: [10, 25, 50].includes(Number(raw("pageSize"))) ? Number(raw("pageSize")) : 10,
  };
}
export function enableDependencies(
  selected: string[],
  code: string,
  catalog: ProductModule[],
): string[] {
  const set = new Set(selected);
  function add(value: string) {
    const mod = catalog.find((x) => x.code === value);
    if (!mod?.available || set.has(value)) return;
    set.add(value);
    mod.dependencies.forEach(add);
  }
  add(code);
  return [...set];
}
export function dependentModules(
  selected: string[],
  code: string,
  catalog: ProductModule[],
): string[] {
  const removed = new Set([code]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const mod of catalog)
      if (
        selected.includes(mod.code) &&
        !removed.has(mod.code) &&
        mod.dependencies.some((x) => removed.has(x))
      ) {
        removed.add(mod.code);
        changed = true;
      }
  }
  return selected.filter((x) => removed.has(x));
}
