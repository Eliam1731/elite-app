import Link from "next/link";
import { Ruler } from "lucide-react";

import { toggleSizeOptionActiveAction } from "@/features/size-options/actions";
import type { SizeOptionRecord } from "@/types/database";

export function SizeOptionCard({ option }: { option: SizeOptionRecord }) {
  const toggleAction = toggleSizeOptionActiveAction.bind(
    null,
    option.id,
    !option.is_active,
    "/tallas",
  );

  return (
    <article className="rounded-[1.75rem] border border-[var(--color-line)] bg-[var(--color-elevated)] p-4 shadow-[var(--shadow-soft)]">
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,var(--color-brand-soft),var(--color-brand))] text-white shadow-[0_14px_26px_var(--color-brand-shadow)] [&_svg]:text-white [&_svg]:stroke-white">
          <Ruler className="h-5 w-5" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-[var(--color-ink)]">
                {option.label}
              </p>
            </div>
            <span
              className={`inline-flex rounded-full px-3 py-1 text-[11px] font-semibold ${
                option.is_active
                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200"
                  : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200"
              }`}
            >
              {option.is_active ? "Activa" : "Inactiva"}
            </span>
          </div>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <Link
              href={`/tallas/${option.id}/editar`}
              className="inline-flex min-h-11 flex-1 items-center justify-center rounded-full border border-[var(--color-line)] bg-[var(--color-panel)] px-4 text-sm font-semibold text-[var(--color-ink)]"
            >
              Editar
            </Link>
            <form action={toggleAction} className="flex-1">
              <button
                type="submit"
                className={`inline-flex min-h-11 w-full items-center justify-center rounded-full px-4 text-sm font-semibold ${
                  option.is_active
                    ? "border border-amber-200 bg-amber-50 text-amber-900"
                    : "bg-[linear-gradient(135deg,var(--color-brand-soft),var(--color-brand))] text-white shadow-[0_14px_28px_var(--color-brand-shadow)]"
                }`}
              >
                <span className={option.is_active ? "" : "text-white"}>
                  {option.is_active ? "Desactivar" : "Activar"}
                </span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </article>
  );
}
