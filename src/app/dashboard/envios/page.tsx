import { Landmark } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { PageIntro } from "@/components/shared/page-intro";
import { createShippingExpenseAction } from "@/features/shipping-expenses/actions";
import { formatCurrency, formatDate } from "@/features/quotes/calculations";
import { normalizeOrderStatus } from "@/features/orders/status";
import { SupabaseBanner } from "@/features/clients/components/supabase-banner";
import { SettingsWarning } from "@/features/quotes/components/settings-warning";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { getBusinessSettings } from "@/services/business-settings/queries";
import { getMonthlyShippingExpensesDetail } from "@/services/dashboard/queries";
import { getOrders } from "@/services/orders/queries";

type DashboardShippingPageProps = {
  searchParams?: Promise<{
    message?: string;
  }>;
};

export default async function DashboardShippingPage({
  searchParams,
}: DashboardShippingPageProps) {
  const configured = isSupabaseConfigured();
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const dashboardMessage = resolvedSearchParams?.message ?? "";

  if (!configured) {
    return (
      <div className="space-y-6">
        <PageIntro
          eyebrow="Dashboard"
          title="Gastos de envio"
          description="Conecta Supabase para revisar el detalle."
          backHref="/dashboard"
        />
        <SupabaseBanner />
      </div>
    );
  }

  const [settings, detail, orders] = await Promise.all([
    getBusinessSettings(),
    getMonthlyShippingExpensesDetail(),
    getOrders(),
  ]);

  if (!settings) {
    return (
      <div className="space-y-6">
        <PageIntro
          eyebrow="Dashboard"
          title="Gastos de envio"
          description="Falta la configuracion general del negocio."
          backHref="/dashboard"
        />
        <SettingsWarning />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow="Dashboard"
        title="Gastos de envio"
        description={`Registro mensual de envios para ${detail.monthLabel}.`}
        backHref="/dashboard"
      />

      <section className="grid gap-3 xl:grid-cols-[0.95fr_1.05fr]">
        <article className="rounded-[1.75rem] border border-[var(--color-line)] bg-[var(--color-elevated)] p-4 shadow-[var(--shadow-soft)]">
          <div className="flex items-center gap-2 text-sm font-semibold text-[var(--color-ink)]">
            <Landmark className="h-4 w-4 text-[var(--color-brand)]" />
            Registrar gasto
          </div>
          <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
            Registra el gasto con fecha de hoy y, si quieres, relaciona el envio con un pedido.
          </p>

          {dashboardMessage === "shipping-expense-created" ? (
            <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
              El gasto de envio se registro correctamente.
            </div>
          ) : null}
          {dashboardMessage === "shipping-expense-invalid" ? (
            <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              Revisa el monto e intenta de nuevo.
            </div>
          ) : null}
          {dashboardMessage === "shipping-expense-error" ? (
            <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
              No se pudo guardar el gasto de envio.
            </div>
          ) : null}

          <form action={createShippingExpenseAction} className="mt-4 space-y-3">
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
                className="h-12 w-full rounded-2xl border border-[var(--color-line)] bg-[var(--color-input)] px-4 text-sm text-[var(--color-ink)] outline-none transition focus:border-[var(--color-brand)]"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-[var(--color-ink)]">
                Pedido relacionado
              </label>
              <select
                name="order_id"
                defaultValue=""
                className="h-12 w-full rounded-2xl border border-[var(--color-line)] bg-[var(--color-input)] px-4 text-sm text-[var(--color-ink)] outline-none transition focus:border-[var(--color-brand)]"
              >
                <option value="">Sin relacionar</option>
                {orders
                  .filter(
                    (order) => normalizeOrderStatus(order.status) !== "cancelado",
                  )
                  .map((order) => (
                    <option key={order.id} value={order.id}>
                      {order.folio} - {order.clients?.name || "Cliente sin nombre"}
                    </option>
                  ))}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-[var(--color-ink)]">
                Notas
              </label>
              <textarea
                name="notes"
                rows={3}
                placeholder="Guia, paqueteria o detalle del envio"
                className="w-full rounded-2xl border border-[var(--color-line)] bg-[var(--color-input)] px-4 py-3 text-sm text-[var(--color-ink)] outline-none transition focus:border-[var(--color-brand)]"
              />
            </div>
            <button
              type="submit"
              className="inline-flex min-h-11 w-full items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--color-brand-soft),var(--color-brand))] px-4 text-sm font-semibold text-white shadow-[0_14px_28px_var(--color-brand-shadow)]"
            >
              <span className="text-white">Registrar gasto de envio</span>
            </button>
          </form>
        </article>

        <article className="rounded-[1.75rem] border border-[var(--color-line)] bg-[var(--color-elevated)] p-4 shadow-[var(--shadow-soft)]">
          <div className="rounded-2xl bg-[var(--color-panel)] px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--color-soft-muted)]">
              Total gastado del mes
            </p>
            <p className="mt-1 text-2xl font-bold text-[var(--color-ink)]">
              {formatCurrency(detail.total, settings.currency_code)}
            </p>
          </div>

          {detail.items.length ? (
            <div className="mt-4 space-y-3">
              {detail.items.map((expense) => (
                <div
                  key={expense.id}
                  className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-panel)] px-4 py-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[var(--color-ink)]">
                        {expense.folio
                          ? `${expense.folio} - ${expense.clientName || "Cliente sin nombre"}`
                          : "Envio sin pedido asociado"}
                      </p>
                      <p className="mt-1 text-xs text-[var(--color-muted)]">
                        {formatDate(expense.expenseDate)}
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-[var(--color-ink)]">
                      {formatCurrency(expense.amount, settings.currency_code)}
                    </p>
                  </div>
                  {expense.notes ? (
                    <p className="mt-3 text-sm leading-6 text-[var(--color-muted)]">
                      {expense.notes}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-4">
              <EmptyState
                icon={<Landmark className="h-6 w-6" />}
                title="Sin gastos de envio"
                description="Aun no hay gastos de envio registrados en el mes actual."
              />
            </div>
          )}
        </article>
      </section>
    </div>
  );
}
