import { CreditCard, Landmark, NotebookPen } from "lucide-react";

import { createPaymentAction } from "@/features/payments/actions";
import { formatCurrency, formatDate } from "@/features/quotes/calculations";
import type { PaymentRecord } from "@/types/database";

type OrderPaymentsSectionProps = {
  orderId: string;
  totalAmount: number;
  expectedDownPaymentAmount: number;
  totalPaid: number;
  pendingAmount: number;
  payments: PaymentRecord[];
  currencyCode: string;
  message?: string;
};

function PaymentMessage({ message }: { message?: string }) {
  if (message === "payment-created") {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
        El pago se registro correctamente.
      </div>
    );
  }

  if (message === "payment-exceeds-pending") {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        El pago no puede ser mayor al saldo pendiente.
      </div>
    );
  }

  if (message === "payment-fully-paid") {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        Este pedido ya no tiene saldo pendiente.
      </div>
    );
  }

  if (message === "payment-missing-client") {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
        El pedido no tiene cliente asociado, asi que no se puede guardar el pago.
      </div>
    );
  }

  if (message === "payment-invalid" || message === "payment-error" || message === "config") {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
        No se pudo registrar el pago. Revisa los datos e intenta de nuevo.
      </div>
    );
  }

  return null;
}

export function OrderPaymentsSection({
  orderId,
  totalAmount,
  expectedDownPaymentAmount,
  totalPaid,
  pendingAmount,
  payments,
  currencyCode,
  message,
}: OrderPaymentsSectionProps) {
  const action = createPaymentAction.bind(null, orderId);
  const canCreatePayment = pendingAmount > 0;

  return (
    <section
      id="pagos"
      className="scroll-mt-32 rounded-[1.6rem] border border-[var(--color-line)] bg-[var(--color-elevated)] p-4 shadow-[var(--shadow-soft)]"
    >
      <div className="flex items-center gap-2 text-sm font-semibold text-[var(--color-ink)]">
        <CreditCard className="h-4 w-4 text-[var(--color-brand)]" />
        Pagos
      </div>
      <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
        Registra anticipos, abonos y liquidaciones del pedido desde este mismo detalle.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl bg-[var(--color-panel)] px-4 py-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--color-soft-muted)]">
            Total
          </p>
          <p className="mt-1 text-lg font-semibold text-[var(--color-ink)]">
            {formatCurrency(totalAmount, currencyCode)}
          </p>
        </div>
        <div className="rounded-2xl bg-[var(--color-panel)] px-4 py-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--color-soft-muted)]">
            Anticipo esperado
          </p>
          <p className="mt-1 text-lg font-semibold text-[var(--color-ink)]">
            {formatCurrency(expectedDownPaymentAmount, currencyCode)}
          </p>
        </div>
        <div className="rounded-2xl bg-[var(--color-panel)] px-4 py-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--color-soft-muted)]">
            Total pagado
          </p>
          <p className="mt-1 text-lg font-semibold text-[var(--color-ink)]">
            {formatCurrency(totalPaid, currencyCode)}
          </p>
        </div>
        <div className="rounded-2xl bg-[var(--color-panel)] px-4 py-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--color-soft-muted)]">
            Saldo pendiente
          </p>
          <p className="mt-1 text-lg font-semibold text-[var(--color-ink)]">
            {formatCurrency(pendingAmount, currencyCode)}
          </p>
        </div>
      </div>

      <div className="mt-4">
        <PaymentMessage message={message} />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <article className="rounded-[1.4rem] border border-[var(--color-line)] bg-[var(--color-panel)] p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-[var(--color-ink)]">
            <Landmark className="h-4 w-4 text-[var(--color-brand)]" />
            Registrar pago
          </div>
          <form action={action} className="mt-4 space-y-3">
            <div>
              <label className="mb-2 block text-sm font-semibold text-[var(--color-ink)]">
                Monto
              </label>
              <input
                type="number"
                name="amount"
                min="0.01"
                step="0.01"
                max={canCreatePayment ? pendingAmount.toFixed(2) : undefined}
                placeholder="0.00"
                className="h-12 w-full rounded-2xl border border-[var(--color-line)] bg-[var(--color-input)] px-4 text-sm text-[var(--color-ink)] outline-none transition focus:border-[var(--color-brand)]"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-[var(--color-ink)]">
                Metodo
              </label>
              <select
                name="payment_method"
                defaultValue="efectivo"
                className="h-12 w-full rounded-2xl border border-[var(--color-line)] bg-[var(--color-input)] px-4 text-sm text-[var(--color-ink)] outline-none transition focus:border-[var(--color-brand)]"
              >
                <option value="efectivo">Efectivo</option>
                <option value="transferencia">Transferencia</option>
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-[var(--color-ink)]">
                Notas
              </label>
              <textarea
                name="notes"
                rows={3}
                placeholder="Referencia, comentario o detalle del pago"
                className="w-full rounded-2xl border border-[var(--color-line)] bg-[var(--color-input)] px-4 py-3 text-sm text-[var(--color-ink)] outline-none transition focus:border-[var(--color-brand)]"
              />
            </div>
            <button
              type="submit"
              disabled={!canCreatePayment}
              className="inline-flex min-h-11 w-full items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--color-brand-soft),var(--color-brand))] px-4 text-sm font-semibold text-white shadow-[0_14px_28px_var(--color-brand-shadow)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span className="text-white">
                {canCreatePayment ? "Registrar pago" : "Pedido liquidado"}
              </span>
            </button>
          </form>
        </article>

        <article className="rounded-[1.4rem] border border-[var(--color-line)] bg-[var(--color-panel)] p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-[var(--color-ink)]">
            <NotebookPen className="h-4 w-4 text-[var(--color-brand)]" />
            Historial de pagos
          </div>

          {payments.length ? (
            <div className="mt-4 space-y-3">
              {payments.map((payment) => (
                <div
                  key={payment.id}
                  className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-elevated)] px-4 py-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[var(--color-ink)]">
                        {formatCurrency(payment.amount, currencyCode)}
                      </p>
                      <p className="mt-1 text-xs text-[var(--color-muted)]">
                        {formatDate(payment.payment_date)}
                        {payment.payment_method ? ` - ${payment.payment_method}` : ""}
                      </p>
                    </div>
                  </div>
                  {payment.notes ? (
                    <p className="mt-3 text-sm leading-6 text-[var(--color-muted)]">
                      {payment.notes}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-4 rounded-[1.4rem] border border-dashed border-[var(--color-line-strong)] bg-[var(--color-elevated)] px-4 py-4 text-sm leading-6 text-[var(--color-muted)]">
              Aun no hay pagos registrados para este pedido.
            </div>
          )}
        </article>
      </div>
    </section>
  );
}
