import Link from "next/link";
import { PencilLine } from "lucide-react";

import { toggleProductActiveAction } from "@/features/products/actions";
import { formatCurrency } from "@/features/quotes/calculations";
import type { ProductRecord } from "@/types/database";

type ProductsTableProps = {
  products: ProductRecord[];
  currencyCode?: string;
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

function getCaptureModeLabel(captureMode: ProductRecord["capture_mode"]) {
  return captureMode === "simple" ? "Simple" : "Completa";
}

export function ProductsTable({
  products,
  currencyCode = "MXN",
}: ProductsTableProps) {
  return (
    <section className="overflow-hidden rounded-[1.75rem] border border-[var(--color-line)] bg-[var(--color-elevated)] shadow-[var(--shadow-soft)]">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-[var(--color-panel)]">
            <tr className="text-xs uppercase tracking-[0.16em] text-[var(--color-soft-muted)]">
              <th className="px-4 py-3 font-bold">Nombre</th>
              <th className="px-4 py-3 font-bold">Precio base</th>
              <th className="px-4 py-3 font-bold">Tipo de captura</th>
              <th className="px-4 py-3 font-bold">Estado</th>
              <th className="px-4 py-3 text-right font-bold">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => {
              const toggleAction = toggleProductActiveAction.bind(
                null,
                product.id,
                !product.is_active,
                "/productos",
              );

              return (
                <tr
                  key={product.id}
                  className="border-t border-[var(--color-line)] text-[var(--color-ink)]"
                >
                  <td className="px-4 py-3">
                    <div className="min-w-[12rem]">
                      <p className="font-semibold">{product.name}</p>
                      <p className="mt-1 text-xs text-[var(--color-muted)]">
                        {product.notes || "Sin notas"}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium">
                    {formatCurrency(product.base_price_amount, currencyCode)}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-[var(--color-panel)] px-3 py-1 text-xs font-medium text-[var(--color-muted)]">
                      {getCaptureModeLabel(product.capture_mode)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <form action={toggleAction}>
                      <button
                        type="submit"
                        className="inline-flex items-center gap-3 rounded-full px-1 py-1 text-sm text-[var(--color-ink)] transition hover:opacity-90"
                        aria-label={
                          product.is_active
                            ? `Desactivar producto ${product.name}`
                            : `Activar producto ${product.name}`
                        }
                        title={product.is_active ? "Activo" : "Inactivo"}
                      >
                        <ToggleSwitch
                          checked={product.is_active}
                          label={product.is_active ? "Activo" : "Inactivo"}
                        />
                        <span className="whitespace-nowrap text-xs font-medium text-[var(--color-muted)]">
                          {product.is_active ? "Activo" : "Inactivo"}
                        </span>
                      </button>
                    </form>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end">
                      <Link
                        href={`/productos/${product.id}/editar`}
                        className="inline-flex h-9 items-center justify-center gap-2 rounded-full border border-[var(--color-line)] bg-[var(--color-panel)] px-3 text-xs font-semibold text-[var(--color-ink)]"
                      >
                        <PencilLine className="h-3.5 w-3.5" />
                        <span>Editar</span>
                      </Link>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
