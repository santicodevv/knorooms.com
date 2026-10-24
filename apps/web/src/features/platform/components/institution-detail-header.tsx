import { Building2, Copy, ExternalLink, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
export function InstitutionDetailHeader({
  name,
  status,
  portalUrl,
  onCopy,
  onEdit,
}: {
  name: string;
  status: string;
  portalUrl: string;
  onCopy: () => void;
  onEdit: () => void;
}) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-5 p-5 sm:p-[23px]">
      <div className="flex min-w-0 items-center gap-3.5">
        <span className="flex size-14 shrink-0 items-center justify-center rounded-[14px] bg-blue-50 text-blue-600">
          <Building2 className="size-7" />
        </span>
        <div className="min-w-0">
          <h2 className="text-lg font-bold tracking-tight text-slate-900">{name}</h2>
          <div className="text-muted mt-2 flex flex-wrap items-center gap-2 text-[11px]">
            <a
              href={portalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-w-0 items-center gap-1 break-all hover:text-blue-600"
            >
              {new URL(portalUrl).host}
              <ExternalLink className="size-3 shrink-0" />
            </a>
            <button
              aria-label="Copiar subdominio"
              onClick={onCopy}
              className="rounded p-1 hover:text-blue-600"
            >
              <Copy className="size-3" />
            </button>
            <Badge variant={status === "Active" ? "success" : "destructive"}>
              {status === "Active" ? "Activa" : "Suspendida"}
            </Badge>
          </div>
        </div>
      </div>
      <Button variant="outline" onClick={onEdit}>
        <Pencil />
        Editar información
      </Button>
    </header>
  );
}
