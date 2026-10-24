import { MoreVertical, SlidersHorizontal, UserPlus, Pencil } from "lucide-react";
import { useRowActions } from "../hooks/use-row-actions";
import type { InstitutionRow } from "../schemas/institution-management-schemas";
export function InstitutionRowActions({
  row,
  onOpen,
  onInvite,
}: {
  row: InstitutionRow;
  onOpen: (id: string, tab?: string) => void;
  onInvite: (row: InstitutionRow) => void;
}) {
  const { triggerRef, panelRef, id, position, positionMenu, close } = useRowActions();
  return (
    <>
      <button
        type="button"
        ref={triggerRef}
        popoverTarget={id}
        onClick={positionMenu}
        aria-label={`Más acciones para ${row.name}`}
        className="text-muted flex size-8 cursor-pointer list-none items-center justify-center rounded-lg hover:bg-blue-50 hover:text-blue-600"
      >
        <MoreVertical className="size-4" />
      </button>
      <div
        ref={panelRef}
        id={id}
        popover="auto"
        style={position}
        className="border-divider fixed m-0 w-52 rounded-xl border bg-white p-1.5 text-slate-700 shadow-xl shadow-slate-900/10"
      >
        <button
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-xs text-slate-500 hover:bg-blue-50 hover:text-blue-600"
          onClick={() => {
            close();
            onOpen(row.id, "information");
          }}
        >
          <Pencil className="size-3.5" />
          Editar información
        </button>
        <button
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-xs text-slate-500 hover:bg-blue-50 hover:text-blue-600"
          onClick={() => {
            close();
            onOpen(row.id, "modules");
          }}
        >
          <SlidersHorizontal className="size-3.5" />
          Administrar módulos
        </button>
        <button
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-xs text-slate-500 hover:bg-blue-50 hover:text-blue-600"
          onClick={() => {
            close();
            onInvite(row);
          }}
        >
          <UserPlus className="size-3.5" />
          {row.administratorState === "Active"
            ? "Ver administrador"
            : row.administratorState === "None"
              ? "Invitar administrador"
              : "Gestionar invitación"}
        </button>
      </div>
    </>
  );
}
