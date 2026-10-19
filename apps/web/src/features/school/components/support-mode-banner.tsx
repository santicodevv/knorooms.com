import { ShieldAlert } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface SupportModeBannerProps {
  institutionName: string;
  expiresAt?: string | null;
}

export function SupportModeTopStrip({ institutionName, expiresAt }: SupportModeBannerProps) {
  return (
    <div className="border-b border-amber-300 bg-amber-100/90 px-6 py-2.5 text-amber-950">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 font-semibold">
          <ShieldAlert className="size-4 text-amber-800" />
          <span>
            MODO DE SOPORTE TÉCNICO TEMPORAL ACTIVO — Todas las acciones en {institutionName} quedan
            registradas en auditoría.
          </span>
        </div>
        {expiresAt ? (
          <span className="font-mono font-medium text-amber-900">
            Expira:{" "}
            {new Date(expiresAt).toLocaleString("es-DO", {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </span>
        ) : null}
      </div>
    </div>
  );
}

export function SupportModeCallout({ institutionName, expiresAt }: SupportModeBannerProps) {
  return (
    <Alert variant="warning" className="mb-6">
      <ShieldAlert className="size-4" />
      <AlertTitle>Sesión Temporal de Soporte Técnico</AlertTitle>
      <AlertDescription>
        Está visualizando la institución <strong>{institutionName}</strong> bajo una concesión
        temporal de soporte (tipo de acceso: <code className="font-mono">Support</code>).
        {expiresAt ? ` Vigencia hasta: ${new Date(expiresAt).toLocaleString("es-DO")}.` : ""}
      </AlertDescription>
    </Alert>
  );
}
