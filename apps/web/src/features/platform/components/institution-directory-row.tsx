import { Building2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { InstitutionRowActions } from "./institution-row-actions";
import {
  administratorLabels,
  type InstitutionRow,
} from "../schemas/institution-management-schemas";
export function InstitutionDirectoryRow({
  row,
  onOpen,
  onInvite,
}: {
  row: InstitutionRow;
  onOpen: (id: string, tab?: string) => void;
  onInvite: (row: InstitutionRow) => void;
}) {
  return (
    <tr className="hover:bg-[#fbfcff]">
      <td className="min-w-48 px-[18px] py-4">
        <button className="flex items-center gap-2.5 text-left" onClick={() => onOpen(row.id)}>
          <span className="flex size-[34px] shrink-0 items-center justify-center rounded-[10px] bg-blue-50 text-blue-600">
            <Building2 className="size-[17px]" />
          </span>
          <span>
            <span className="block text-xs font-bold text-slate-800 hover:text-blue-600">
              {row.name}
            </span>
            <span className="text-muted mt-1 block text-[11px]">{row.slug}</span>
          </span>
        </button>
      </td>
      <td className="px-[18px] py-4">
        <Badge variant={row.status === "Active" ? "success" : "destructive"}>
          {row.status === "Active" ? "Activa" : "Suspendida"}
        </Badge>
      </td>
      <td className="px-[18px] py-4">
        <Badge
          variant={
            row.administratorState === "Active"
              ? "success"
              : row.administratorState === "Failed"
                ? "destructive"
                : row.administratorState === "None"
                  ? "secondary"
                  : "warning"
          }
        >
          {administratorLabels[row.administratorState]}
        </Badge>
        {row.administratorEmail ? (
          <p
            className="text-muted mt-1 max-w-48 truncate text-[11px]"
            title={row.administratorEmail}
          >
            {row.administratorEmail}
          </p>
        ) : null}
      </td>
      <td className="px-[18px] py-4">
        <Badge>{row.enabledModules.length} de 6</Badge>
      </td>
      <td className="px-[18px] py-4">
        <div className="flex items-center justify-end gap-1.5">
          <Button variant="outline" size="sm" onClick={() => onOpen(row.id)}>
            <Eye />
            Ver ficha
          </Button>
          <InstitutionRowActions row={row} onOpen={onOpen} onInvite={onInvite} />
        </div>
      </td>
    </tr>
  );
}
