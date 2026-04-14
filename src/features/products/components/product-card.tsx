import { Package2 } from "lucide-react";

import { toggleProductActiveAction } from "@/features/products/actions";
import { formatCurrency } from "@/features/quotes/calculations";
import type { ProductRecord } from "@/types/database";
import Link from "next/link";

type ProductCardProps = {
  product: ProductRecord;
  currencyCode?: string;
};

export function ProductCard({
  product,
  currencyCode = "MXN",
}: ProductCardProps) {
  const toggleAction = toggleProductActiveAction.bind(
    null,
    product.id,
    !product.is_active,
    "/productos",
  );

  return (
    <article className="rounded-[1.75rem] border border-[var(--color-line)] bg-[var(--color-elevated)] p-4 shadow-[var(--shadow-soft)]">
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,var(--color-brand-soft),var(--color-brand))] text-white shadow-[0_14px_26px_var(--color-brand-shadow)] [&_svg]:text-white [&_svg]:stroke-white">
          <Package2 className="h-5 w-5" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <Link
                href={`/productos/${product.id}`}
                className="block truncate text-sm font-semibold text-[var(--color-ink)]"
              >
                {product.name}
              </Link>
              <p className="mt-1 text-xs text-[var(--color-muted)]">
                Captura {product.capture_mode === "simple" ? "simple" : "completa"}
              </p>
            </div>
            <span
              className={`inline-flex rounded-full px-3 py-1 text-[11px] font-semibold ${
                product.is_active
                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200"
                  : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200"
              }`}
            >
              {product.is_active ? "Activo" : "Inactivo"}
            </span>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-[var(--color-muted)]">
            <div className="rounded-2xl bg-[var(--color-panel)] px-3 py-2">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--color-soft-muted)]">
                Precio base
              </p>
              <p className="mt-1 text-sm font-semibold text-[var(--color-ink)]">
                {formatCurrency(product.base_price_amount, currencyCode)}
              </p>
            </div>
            <div className="rounded-2xl bg-[var(--color-panel)] px-3 py-2">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--color-soft-muted)]">
                Modo
              </p>
              <p className="mt-1 text-sm font-semibold capitalize text-[var(--color-ink)]">
                {product.capture_mode}
              </p>
            </div>
          </div>

          <p className="mt-3 line-clamp-2 text-sm leading-6 text-[var(--color-muted)]">
            {product.notes || "Sin notas por ahora."}
          </p>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <Link
              href={`/productos/${product.id}`}
              className="inline-flex min-h-11 flex-1 items-center justify-center rounded-full border border-[var(--color-line)] bg-[var(--color-panel)] px-4 text-sm font-semibold text-[var(--color-ink)]"
            >
              Ver detalle
            </Link>
            <form action={toggleAction} className="flex-1">
              <button
                type="submit"
                className={`inline-flex min-h-11 w-full items-center justify-center rounded-full px-4 text-sm font-semibold ${
                  product.is_active
                    ? "border border-amber-200 bg-amber-50 text-amber-900"
                    : "bg-[linear-gradient(135deg,var(--color-brand-soft),var(--color-brand))] text-white shadow-[0_14px_28px_var(--color-brand-shadow)]"
                }`}
              >
                <span className={product.is_active ? "" : "text-white"}>
                  {product.is_active ? "Desactivar" : "Activar"}
                </span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </article>
  );
}
