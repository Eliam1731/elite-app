import { Factory, PackageSearch, Wallet } from "lucide-react";

import { createOrderCostAction } from "@/features/costs/actions";
import { COST_TYPE_OPTIONS } from "@/features/costs/constants";
import { formatCurrency, formatDate } from "@/features/quotes/calculations";
import type { OrderCostRecord } from "@/types/database";

type OrderCostsSectionProps = {
  orderId: string;
  orderTotal: number;
  costs: OrderCostRecord[];
  totalCosts: number;
  estimatedProfit: number;
  currencyCode: string;
  today: string;
  available: boolean;
  message?: string;
};

const costTypeLabels: Record<(typeof COST_TYPE_OPTIONS)[number], string> = {
  materiales: "Materiales",
  mano_de_obra: "Mano de obra",
  impresion: "Impresion",
  bordado: "Bordado",
  envio: "Envio",
  extras: "Extras",
  otro: "Otro",
};

function CostMessage({
  message,
  available,
}: {
  message?: string;
  available: boolean;
}) {
  if (!available || message === "costs-unavailable") {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        La tabla de costos aun no esta disponible en la base. Aplica la migracion de
        `order_costs` para activar este modulo.
      </div>
    );
  }

  if (message === "cost-created") {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
        El costo se registro correctamente.
      </div>
    );
  }

  if (
    message === "cost-invalid" ||
    message === "cost-date-invalid" ||
    message === "cost-error" ||
    message === "config"
  ) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
        No se pudo registrar el costo. Revisa los datos e intenta de nuevo.
      </div>
    );
  }

  return null;
}

export function OrderCostsSection({
  orderId,
  orderTotal,
  costs,
  totalCosts,
  estimatedProfit,
  currencyCode,
  today,
  available,
  message,
}: OrderCostsSectionProps) {
  const action = createOrderCostAction.bind(null, orderId);

  return (
    <section
      id="costos"
      className="scroll-mt-32 rounded-[1.6rem] border border-[var(--color-line)] bg-[var(--color-elevated)] p-4 shadow-[var(--shadow-soft)]"
    >
      <div className="flex items-center gap-2 text-sm font-semibold text-[var(--color-ink)]">
        <Wallet className="h-4 w-4 text-[var(--color-brand)]" />
        Costos
      </div>
      <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
        Registra los costos reales del pedido para medir utilidad operativa.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl bg-[var(--color-panel)] px-4 py-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--color-soft-muted)]">
            Total pedido
          </p>
          <p className="mt-1 text-lg font-semibold text-[var(--color-ink)]">
            {formatCurrency(orderTotal, currencyCode)}
          </p>
        </div>
        <div className="rounded-2xl bg-[var(--color-panel)] px-4 py-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--color-soft-muted)]">
            Costos acumulados
          </p>
          <p className="mt-1 text-lg font-semibold text-[var(--color-ink)]">
            {formatCurrency(totalCosts, currencyCode)}
          </p>
        </div>
        <div className="rounded-2xl bg-[var(--color-panel)] px-4 py-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--color-soft-muted)]">
            Utilidad estimada
          </p>
          <p className="mt-1 text-lg font-semibold text-[var(--color-ink)]">
            {formatCurrency(estimatedProfit, currencyCode)}
          </p>
        </div>
      </div>

      <div className="mt-4">
        <CostMessage message={message} available={available} />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <article className="rounded-[1.4rem] border border-[var(--color-line)] bg-[var(--color-panel)] p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-[var(--color-ink)]">
            <Factory className="h-4 w-4 text-[var(--color-brand)]" />
            Registrar costo
          </div>
          <form action={action} className="mt-4 space-y-3">
            <div>
              <label className="mb-2 block text-sm font-semibold text-[var(--color-ink)]">
                Tipo de costo
              </label>
              <select
                name="cost_type"
                defaultValue="materiales"
                disabled={!available}
                className="h-12 w-full rounded-2xl border border-[var(--color-line)] bg-[var(--color-input)] px-4 text-sm text-[var(--color-ink)] outline-none transition focus:border-[var(--color-brand)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {COST_TYPE_OPTIONS.map((type) => (
                  <option key={type} value={type}>
                    {costTypeLabels[type]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-[var(--color-ink)]">
                Descripcion
              </label>
              <input
                name="description"
                placeholder="Tela, costura, envio, ajuste..."
                disabled={!available}
                className="h-12 w-full rounded-2xl border border-[var(--color-line)] bg-[var(--color-input)] px-4 text-sm text-[var(--color-ink)] outline-none transition focus:border-[var(--color-brand)] disabled:cursor-not-allowed disabled:opacity-60"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-[var(--color-ink)]">
                Monto
              </label>
              <input
                type="number"
                name="amount"
                min="0.01"
                step="0.01"
                placeholder="0.00"
                disabled={!available}
                className="h-12 w-full rounded-2xl border border-[var(--color-line)] bg-[var(--color-input)] px-4 text-sm text-[var(--color-ink)] outline-none transition focus:border-[var(--color-brand)] disabled:cursor-not-allowed disabled:opacity-60"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-[var(--color-ink)]">
                Fecha
              </label>
              <input
                type="date"
                name="cost_date"
                defaultValue={today}
                max={today}
                disabled={!available}
                className="h-12 w-full rounded-2xl border border-[var(--color-line)] bg-[var(--color-input)] px-4 text-sm text-[var(--color-ink)] outline-none transition focus:border-[var(--color-brand)] disabled:cursor-not-allowed disabled:opacity-60"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-[var(--color-ink)]">
                Notas
              </label>
              <textarea
                name="notes"
                rows={3}
                placeholder="Proveedor, referencia o detalle extra"
                disabled={!available}
                className="w-full rounded-2xl border border-[var(--color-line)] bg-[var(--color-input)] px-4 py-3 text-sm text-[var(--color-ink)] outline-none transition focus:border-[var(--color-brand)] disabled:cursor-not-allowed disabled:opacity-60"
              />
            </div>
            <button
              type="submit"
              disabled={!available}
              className="inline-flex min-h-11 w-full items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--color-brand-soft),var(--color-brand))] px-4 text-sm font-semibold text-white shadow-[0_14px_28px_var(--color-brand-shadow)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span className="text-white">Registrar costo</span>
            </button>
          </form>
        </article>

        <article className="rounded-[1.4rem] border border-[var(--color-line)] bg-[var(--color-panel)] p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-[var(--color-ink)]">
            <PackageSearch className="h-4 w-4 text-[var(--color-brand)]" />
            Historial de costos
          </div>

          {costs.length ? (
            <div className="mt-4 space-y-3">
              {costs.map((cost) => (
                <div
                  key={cost.id}
                  className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-elevated)] px-4 py-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[var(--color-ink)]">
                        {cost.description}
                      </p>
                      <p className="mt-1 text-xs text-[var(--color-muted)]">
                        {costTypeLabels[cost.cost_type]} · {formatDate(cost.cost_date)}
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-[var(--color-ink)]">
                      {formatCurrency(cost.amount, currencyCode)}
                    </p>
                  </div>
                  {cost.notes ? (
                    <p className="mt-3 text-sm leading-6 text-[var(--color-muted)]">
                      {cost.notes}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-4 rounded-[1.4rem] border border-dashed border-[var(--color-line-strong)] bg-[var(--color-elevated)] px-4 py-4 text-sm leading-6 text-[var(--color-muted)]">
              {available
                ? "Aun no hay costos registrados para este pedido."
                : "El historial se habilitara cuando exista la tabla de costos en la base."}
            </div>
          )}
        </article>
      </div>
    </section>
  );
}
