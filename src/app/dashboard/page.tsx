import Link from "next/link";
import {
  ClipboardList,
  CreditCard,
  Gauge,
  Landmark,
  Package2,
  Ruler,
  ShoppingBag,
  Users,
  Wallet,
} from "lucide-react";

import { PageIntro } from "@/components/shared/page-intro";
import { createShippingExpenseAction } from "@/features/shipping-expenses/actions";
import { formatCurrency, formatDate } from "@/features/quotes/calculations";
import { SupabaseBanner } from "@/features/clients/components/supabase-banner";
import { SettingsWarning } from "@/features/quotes/components/settings-warning";
import { normalizeOrderStatus } from "@/features/orders/status";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { getBusinessSettings } from "@/services/business-settings/queries";
import { getMonthlyDashboardSummary } from "@/services/dashboard/queries";
import { getOrders } from "@/services/orders/queries";

const modules = [
  {
    href: "/clientes",
    label: "Clientes",
    description: "Alta, consulta y edicion rapida.",
    icon: Users,
  },
  {
    href: "/cotizaciones",
    label: "Cotizaciones",
    description: "Preparado para el siguiente bloque.",
    icon: ClipboardList,
  },
  {
    href: "/pedidos",
    label: "Pedidos",
    description: "Seguimiento de produccion y entrega.",
    icon: ShoppingBag,
  },
  {
    href: "/tallas",
    label: "Tallas",
    description: "Catalogo global y captura operativa por pedido.",
    icon: Ruler,
  },
  {
    href: "/productos",
    label: "Productos",
    description: "Catalogo base para cotizar y producir.",
    icon: Package2,
  },
];

const summaryCards = [
  {
    key: "salesThisMonth",
    label: "Ventas del mes",
    icon: ShoppingBag,
  },
  {
    key: "collectedThisMonth",
    label: "Ingresos del mes",
    icon: Wallet,
  },
  {
    key: "pendingCollection",
    label: "Pendiente por cobrar",
    icon: CreditCard,
  },
] as const;

type DashboardPageProps = {
  searchParams?: Promise<{
    message?: string;
  }>;
};

export default async function DashboardPage({
  searchParams,
}: DashboardPageProps) {
  const configured = isSupabaseConfigured();
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const dashboardMessage = resolvedSearchParams?.message ?? "";

  if (!configured) {
    return (
      <div className="space-y-6">
        <PageIntro
          eyebrow="Elite"
          title="Dashboard"
          description="Conecta Supabase para ver el resumen financiero del mes."
        />
        <SupabaseBanner />
      </div>
    );
  }

  const [settings, summary, orders] = await Promise.all([
    getBusinessSettings(),
    getMonthlyDashboardSummary(),
    getOrders(),
  ]);

  if (!settings) {
    return (
      <div className="space-y-6">
        <PageIntro
          eyebrow="Elite"
          title="Dashboard"
          description="Falta la configuracion general del negocio para mostrar importes."
        />
        <SettingsWarning />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow="Elite"
        title="Dashboard financiero"
        description={`Resumen de ${summary.monthLabel} para revisar ventas, ingresos y pendiente por cobrar desde el celular.`}
      />

      <section className="rounded-[1.75rem] border border-blue-400/30 bg-gradient-to-r from-blue-700 to-blue-500 p-5 text-white shadow-[0_22px_40px_rgba(29,78,216,0.32)] [&_svg]:text-white [&_svg]:stroke-white">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/12 text-white shadow-[0_14px_26px_rgba(15,23,42,0.18)]">
            <Gauge className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-white/75">
              Dashboard
            </p>
            <h2 className="mt-2 font-display text-2xl font-bold text-white">
              Corte mensual
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/86">
              Vista simple de rendimiento para seguir el mes actual sin graficas
              complejas ni ruido visual.
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          const value = summary[card.key];

          return (
            <article
              key={card.key}
              className="rounded-[1.75rem] border border-[var(--color-line)] bg-[var(--color-elevated)] p-4 shadow-[var(--shadow-soft)]"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,var(--color-brand-soft),var(--color-brand))] text-white shadow-[0_14px_26px_var(--color-brand-shadow)] [&_svg]:text-white [&_svg]:stroke-white">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--color-soft-muted)]">
                    {card.label}
                  </p>
                  <p className="mt-2 text-2xl font-bold tracking-tight text-[var(--color-ink)]">
                    {formatCurrency(value, settings.currency_code)}
                  </p>
                  <p className="mt-1 text-sm text-[var(--color-muted)]">
                    Mes actual: {summary.monthLabel}
                  </p>
                </div>
              </div>
            </article>
          );
        })}
      </section>

      <section className="grid gap-3 xl:grid-cols-2">
        <article className="rounded-[1.75rem] border border-[var(--color-line)] bg-[var(--color-elevated)] p-4 shadow-[var(--shadow-soft)]">
          <div className="flex items-center gap-2 text-sm font-semibold text-[var(--color-ink)]">
            <Wallet className="h-4 w-4 text-[var(--color-brand)]" />
            Ingresos del mes
          </div>
          <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
            Pagos registrados durante {summary.monthLabel}. Incluye anticipos de pedidos que aun no se entregan.
          </p>
          <div className="mt-4 rounded-2xl bg-[var(--color-panel)] px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--color-soft-muted)]">
              Total
            </p>
            <p className="mt-1 text-2xl font-bold text-[var(--color-ink)]">
              {formatCurrency(summary.collectedThisMonth, settings.currency_code)}
            </p>
          </div>

          {summary.incomeOrders.length ? (
            <div className="mt-4 space-y-3">
              {summary.incomeOrders.map((item) => (
                <div
                  key={item.orderId}
                  className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-panel)] px-4 py-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[var(--color-ink)]">{item.folio}</p>
                      <p className="mt-1 text-xs text-[var(--color-muted)]">{item.clientName}</p>
                    </div>
                    <p className="text-sm font-semibold text-[var(--color-ink)]">
                      {formatCurrency(item.amount, settings.currency_code)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-4 rounded-[1.4rem] border border-dashed border-[var(--color-line-strong)] bg-[var(--color-panel)] px-4 py-4 text-sm leading-6 text-[var(--color-muted)]">
              Aun no hay ingresos registrados este mes.
            </div>
          )}
        </article>

        <article className="rounded-[1.75rem] border border-[var(--color-line)] bg-[var(--color-elevated)] p-4 shadow-[var(--shadow-soft)]">
          <div className="flex items-center gap-2 text-sm font-semibold text-[var(--color-ink)]">
            <CreditCard className="h-4 w-4 text-[var(--color-brand)]" />
            Pendiente por cobrar
          </div>
          <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
            Pedidos con saldo pendiente para ubicar rapido donde sigue faltando dinero.
          </p>
          <div className="mt-4 rounded-2xl bg-[var(--color-panel)] px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--color-soft-muted)]">
              Total
            </p>
            <p className="mt-1 text-2xl font-bold text-[var(--color-ink)]">
              {formatCurrency(summary.pendingCollection, settings.currency_code)}
            </p>
          </div>

          {summary.pendingOrders.length ? (
            <div className="mt-4 space-y-3">
              {summary.pendingOrders.map((item) => (
                <div
                  key={item.orderId}
                  className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-panel)] px-4 py-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[var(--color-ink)]">{item.folio}</p>
                      <p className="mt-1 text-xs text-[var(--color-muted)]">{item.clientName}</p>
                    </div>
                    <p className="text-sm font-semibold text-[var(--color-ink)]">
                      {formatCurrency(item.amount, settings.currency_code)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-4 rounded-[1.4rem] border border-dashed border-[var(--color-line-strong)] bg-[var(--color-panel)] px-4 py-4 text-sm leading-6 text-[var(--color-muted)]">
              No hay pedidos con saldo pendiente por cobrar.
            </div>
          )}
        </article>
      </section>

      <section className="grid gap-3 xl:grid-cols-[0.95fr_1.05fr]">
        <article className="rounded-[1.75rem] border border-[var(--color-line)] bg-[var(--color-elevated)] p-4 shadow-[var(--shadow-soft)]">
          <div className="flex items-center gap-2 text-sm font-semibold text-[var(--color-ink)]">
            <Landmark className="h-4 w-4 text-[var(--color-brand)]" />
            Gastos de envio
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
                    (order) =>
                      normalizeOrderStatus(order.status) !== "cancelado",
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
          <div className="flex items-center gap-2 text-sm font-semibold text-[var(--color-ink)]">
            <Landmark className="h-4 w-4 text-[var(--color-brand)]" />
            Resumen de envios del mes
          </div>
          <div className="mt-4 rounded-2xl bg-[var(--color-panel)] px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--color-soft-muted)]">
              Total gastado
            </p>
            <p className="mt-1 text-2xl font-bold text-[var(--color-ink)]">
              {formatCurrency(summary.shippingExpensesThisMonth, settings.currency_code)}
            </p>
          </div>

          {summary.shippingExpenses.length ? (
            <div className="mt-4 space-y-3">
              {summary.shippingExpenses.map((expense) => (
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
            <div className="mt-4 rounded-[1.4rem] border border-dashed border-[var(--color-line-strong)] bg-[var(--color-panel)] px-4 py-4 text-sm leading-6 text-[var(--color-muted)]">
              Aun no hay gastos de envio registrados este mes.
            </div>
          )}
        </article>
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {modules.map((module) => {
          const Icon = module.icon;

          return (
            <Link
              key={module.href}
              href={module.href}
              className="rounded-[1.75rem] border border-[var(--color-line)] bg-[var(--color-elevated)] p-4 shadow-[var(--shadow-soft)]"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,var(--color-brand-soft),var(--color-brand))] text-white shadow-[0_14px_26px_var(--color-brand-shadow)] [&_svg]:text-white [&_svg]:stroke-white">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[var(--color-ink)]">
                    {module.label}
                  </p>
                  <p className="text-xs leading-5 text-[var(--color-muted)]">
                    {module.description}
                  </p>
                </div>
              </div>
            </Link>
          );
        })}
      </section>
    </div>
  );
}
