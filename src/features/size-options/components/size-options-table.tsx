import Link from "next/link";
import { PencilLine } from "lucide-react";

import {
  createSizeOptionQuickAction,
  toggleSizeOptionActiveAction,
} from "@/features/size-options/actions";
import type { SizeOptionRecord } from "@/types/database";

type SizeOptionsTableProps = {
  options: SizeOptionRecord[];
  message?: string;
};

function ToggleSwitch({
  checked,
  label,
}: {
  checked: boolean;
  label: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition ${
        checked ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-700"
      }`}
    >
      <span
        className={`inline-block h-5 w-5 rounded-full bg-white shadow transition ${
          checked ? "translate-x-6" : "translate-x-1"
        }`}
      />
      <span className="sr-only">{label}</span>
    </span>
  );
}

export function SizeOptionsTable({ options, message }: SizeOptionsTableProps) {
  return (
    <div className="space-y-4">
      <section className="rounded-[1.75rem] border border-[var(--color-line)] bg-[var(--color-elevated)] p-4 shadow-[var(--shadow-soft)]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-[var(--color-ink)]">Nueva talla</p>
            <p className="mt-1 text-sm leading-6 text-[var(--color-muted)]">
              Agrega tallas simples como `S`, `M`, `10` o `12` sin salir de esta
              pantalla.
            </p>
          </div>
          <form action={createSizeOptionQuickAction} className="flex w-full gap-2 sm:max-w-md">
            <input
              name="label"
              placeholder="Ej. M o 12"
              className="h-12 min-w-0 flex-1 rounded-2xl border border-[var(--color-line)] bg-[var(--color-input)] px-4 text-sm text-[var(--color-ink)] outline-none transition placeholder:text-[var(--color-soft-muted)] focus:border-[var(--color-brand)] focus:bg-[var(--color-panel-strong)]"
            />
            <button
              type="submit"
              className="inline-flex h-12 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--color-brand-soft),var(--color-brand))] px-5 text-sm font-semibold text-white shadow-[0_14px_28px_var(--color-brand-shadow)]"
            >
              <span className="text-white">Nueva talla</span>
            </button>
          </form>
        </div>

        {message === "size-created" ? (
          <p className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
            La talla se agrego correctamente.
          </p>
        ) : null}
        {message === "size-invalid" ? (
          <p className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Captura una talla valida antes de guardar.
          </p>
        ) : null}
        {message === "size-duplicate" ? (
          <p className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Esa talla ya existe en el catalogo.
          </p>
        ) : null}
        {message === "size-error" ? (
          <p className="mt-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
            No se pudo guardar la talla.
          </p>
        ) : null}
      </section>

      <section className="overflow-hidden rounded-[1.75rem] border border-[var(--color-line)] bg-[var(--color-elevated)] shadow-[var(--shadow-soft)]">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-[var(--color-panel)]">
              <tr className="text-xs uppercase tracking-[0.16em] text-[var(--color-soft-muted)]">
                <th className="px-4 py-3 font-bold">Talla</th>
                <th className="px-4 py-3 font-bold">Estado</th>
                <th className="px-4 py-3 text-right font-bold">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {options.map((option) => {
                const toggleAction = toggleSizeOptionActiveAction.bind(
                  null,
                  option.id,
                  !option.is_active,
                  "/tallas",
                );

                return (
                  <tr
                    key={option.id}
                    className="border-t border-[var(--color-line)] text-[var(--color-ink)]"
                  >
                    <td className="px-4 py-3 font-semibold">{option.label}</td>
                    <td className="px-4 py-3">
                      <form action={toggleAction}>
                        <button
                          type="submit"
                          className="inline-flex items-center gap-3 rounded-full px-1 py-1 text-sm text-[var(--color-ink)] transition hover:opacity-90"
                          aria-label={
                            option.is_active
                              ? `Desactivar talla ${option.label}`
                              : `Activar talla ${option.label}`
                          }
                          title={option.is_active ? "Activa" : "Inactiva"}
                        >
                          <ToggleSwitch
                            checked={option.is_active}
                            label={option.is_active ? "Activa" : "Inactiva"}
                          />
                          <span className="whitespace-nowrap text-xs font-medium text-[var(--color-muted)]">
                            {option.is_active ? "Activa" : "Inactiva"}
                          </span>
                        </button>
                      </form>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/tallas/${option.id}/editar`}
                        className="inline-flex h-9 items-center justify-center gap-2 rounded-full border border-[var(--color-line)] bg-[var(--color-panel)] px-3 text-xs font-semibold text-[var(--color-ink)]"
                      >
                        <PencilLine className="h-3.5 w-3.5" />
                        <span>Editar</span>
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
