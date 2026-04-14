import Link from "next/link";
import { CalendarDays, ShoppingBag } from "lucide-react";

import {
  getOrderStatusClasses,
  getOrderStatusLabel,
  isOrderOverdue,
} from "@/features/orders/status";
import { formatCurrency, formatDate } from "@/features/quotes/calculations";
import type { OrderListRecord } from "@/types/database";

type OrderCardProps = {
  order: OrderListRecord;
  currencyCode: string;
};

export function OrderCard({ order, currencyCode }: OrderCardProps) {
  const overdue = isOrderOverdue(order);

  return (
    <Link
      href={`/pedidos/${order.id}`}
      className={`rounded-[1.6rem] border bg-[var(--color-elevated)] p-4 shadow-[var(--shadow-soft)] transition hover:border-[var(--color-line-strong)] hover:shadow-[0_18px_38px_rgba(15,23,42,0.12)] ${
        overdue ? "border-amber-300" : "border-[var(--color-line)]"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,var(--color-brand-soft),var(--color-brand))] text-white shadow-[0_14px_26px_var(--color-brand-shadow)]">
          <ShoppingBag className="h-5 w-5 text-white stroke-white" />
        </div>

        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-[var(--color-ink)]">
                {order.clients?.name || "Cliente sin nombre"}
              </p>
              <p className="mt-1 truncate text-xs text-[var(--color-muted)]">
                {order.folio}
              </p>
            </div>
            <span
              className={`rounded-full px-3 py-1 text-[11px] font-semibold ${getOrderStatusClasses(order.status)}`}
            >
              {getOrderStatusLabel(order.status)}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs text-[var(--color-muted)] md:grid-cols-4">
            <div className="rounded-2xl bg-[var(--color-panel)] px-3 py-2">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--color-soft-muted)]">
                Tipo
              </p>
              <p className="mt-1 text-sm font-semibold text-[var(--color-ink)]">
                {order.sale_type === "factura" ? "Factura" : "Normal"}
              </p>
            </div>
            <div className="rounded-2xl bg-[var(--color-panel)] px-3 py-2">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--color-soft-muted)]">
                Total
              </p>
              <p className="mt-1 text-sm font-semibold text-[var(--color-ink)]">
                {formatCurrency(order.total_amount, currencyCode)}
              </p>
            </div>
            <div className="rounded-2xl bg-[var(--color-panel)] px-3 py-2">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--color-soft-muted)]">
                Creado
              </p>
              <div className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-[var(--color-ink)]">
                <CalendarDays className="h-3.5 w-3.5 text-[var(--color-brand)]" />
                <span>{formatDate(order.created_at)}</span>
              </div>
            </div>
            <div className="rounded-2xl bg-[var(--color-panel)] px-3 py-2">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--color-soft-muted)]">
                Compromiso
              </p>
              <p className="mt-1 text-sm font-semibold text-[var(--color-ink)]">
                {order.due_date ? formatDate(order.due_date) : "Sin fecha"}
              </p>
            </div>
          </div>

          {overdue ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-900">
              Pedido atrasado por fecha de entrega.
            </div>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
