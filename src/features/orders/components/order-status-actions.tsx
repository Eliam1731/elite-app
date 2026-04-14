import {
  canonicalOrderStatuses,
  getOrderStatusLabel,
  normalizeOrderStatus,
} from "@/features/orders/status";
import { updateOrderStatusAction } from "@/features/orders/actions";
import { PRODUCTION_MIN_PAYMENT_PERCENT_LABEL } from "@/features/quotes/calculations";
import type { OrderRecord } from "@/types/database";

type OrderStatusActionsProps = {
  order: OrderRecord;
};

export function OrderStatusActions({ order }: OrderStatusActionsProps) {
  const currentStatus = normalizeOrderStatus(order.status);

  return (
    <section className="rounded-[1.6rem] border border-[var(--color-line)] bg-[var(--color-elevated)] p-4 shadow-[var(--shadow-soft)]">
      <h2 className="text-sm font-semibold text-[var(--color-ink)]">
        Acciones del pedido
      </h2>
      <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
        Cambia el estado manualmente segun el avance real del pedido. Para pasar a
        produccion se valida el anticipo minimo del {PRODUCTION_MIN_PAYMENT_PERCENT_LABEL} y las tallas completas.
      </p>
      <div className="mt-4 grid gap-3">
        {canonicalOrderStatuses.map((status) => {
          const formAction = updateOrderStatusAction.bind(null, order.id, status);
          const isCurrent = status === currentStatus;

          return (
            <form key={status} action={formAction}>
              <button
                type="submit"
                disabled={isCurrent}
                className={
                  isCurrent
                    ? "inline-flex min-h-11 w-full items-center justify-center rounded-full border border-[var(--color-line)] bg-[var(--color-panel)] px-4 text-sm font-semibold text-[var(--color-muted)] disabled:cursor-default"
                    : status === "cancelado"
                      ? "inline-flex min-h-11 w-full items-center justify-center rounded-full border border-rose-200 bg-rose-50 px-4 text-sm font-semibold text-rose-800"
                      : "inline-flex min-h-11 w-full items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--color-brand-soft),var(--color-brand))] px-4 text-sm font-semibold text-white shadow-[0_14px_28px_var(--color-brand-shadow)]"
                }
              >
                <span className={isCurrent || status === "cancelado" ? "" : "text-white"}>
                  {isCurrent
                    ? `${getOrderStatusLabel(status)} actual`
                    : `Cambiar a ${getOrderStatusLabel(status)}`}
                </span>
              </button>
            </form>
          );
        })}
      </div>
    </section>
  );
}
