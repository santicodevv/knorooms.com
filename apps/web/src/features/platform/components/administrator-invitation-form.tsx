import { Info, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { AdministratorDialogState } from "../hooks/use-administrator-dialog";
export function AdministratorInvitationForm({
  state: s,
  active,
  onClose,
}: {
  state: AdministratorDialogState;
  active: boolean;
  onClose: () => void;
}) {
  return (
    <form onSubmit={s.send} className="space-y-4">
      <div>
        <label
          htmlFor="administrator-email"
          className="mb-2 block text-[11px] font-semibold text-slate-600"
        >
          Correo electrónico del administrador <span className="text-red-700">*</span>
        </label>
        <Input
          id="administrator-email"
          type="email"
          autoComplete="email"
          placeholder="director@colegio.edu.do"
          disabled={s.busy || !active}
          aria-invalid={Boolean(s.form.formState.errors.email)}
          {...s.form.register("email")}
        />
        {s.form.formState.errors.email ? (
          <p className="mt-2 text-[11px] text-red-600">{s.form.formState.errors.email.message}</p>
        ) : null}
        <p className="text-muted mt-2 text-[11px] leading-5">
          La persona recibirá un enlace seguro para activar su acceso.
        </p>
      </div>
      <p className="flex gap-2.5 rounded-[9px] border border-blue-100 bg-blue-50/50 p-3 text-[11px] leading-5 text-blue-700">
        <Info className="mt-0.5 size-4 shrink-0" />
        Si ya tiene una cuenta, confirmará su contraseña actual para vincularse al colegio. No
        necesitas crear ni conocer su contraseña.
      </p>
      {!active ? (
        <p className="text-[11px] text-amber-700">
          Reactiva la institución para enviar invitaciones.
        </p>
      ) : null}
      <footer className="flex justify-end gap-2 pt-2">
        <Button variant="outline" disabled={s.busy} onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit" disabled={s.busy || !active}>
          <Send />
          {s.busy ? "Enviando…" : "Enviar invitación"}
        </Button>
      </footer>
    </form>
  );
}
