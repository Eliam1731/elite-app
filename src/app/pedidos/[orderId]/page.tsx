import {
  ClipboardList,
  ReceiptText,
  ShoppingBag,
  UserRound,
  Wallet,
} from "lucide-react";
import { notFound } from "next/navigation";

import { PageIntro } from "@/components/shared/page-intro";
import { SupabaseBanner } from "@/features/clients/components/supabase-banner";
import { OrderCostsSection } from "@/features/costs/components/order-costs-section";
import { updateOrderDueDateAction } from "@/features/orders/actions";
import { OrderDetailNav } from "@/features/orders/components/order-detail-nav";
import { getTodayForDateInput } from "@/features/orders/due-date";
import { OrderStatusActions } from "@/features/orders/components/order-status-actions";
import {
  getOrderStatusClasses,
  getOrderStatusLabel,
  isOrderOverdue,
} from "@/features/orders/status";
import { OrderPaymentsSection } from "@/features/payments/components/order-payments-section";
import { OrderSizesSection } from "@/features/sizes/components/order-sizes-section";
import { formatCurrency } from "@/features/quotes/calculations";
import { SettingsWarning } from "@/features/quotes/components/settings-warning";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { getBusinessSettings } from "@/services/business-settings/queries";
import { getOrderCostsByOrderId, getTotalOrderCosts } from "@/services/costs/queries";
import { getOrderById } from "@/services/orders/queries";
import { getPaymentsByOrderId, getTotalPaid } from "@/services/payments/queries";
import { getSizeTableByOrderId } from "@/services/sizes/queries";

type OrderDetailPageProps = {
  params: Promise<{ orderId: string }>;
  searchParams?: Promise<{ message?: string; editRow?: string }>;
};

export default async function OrderDetailPage({
  params,
  searchParams,
}: OrderDetailPageProps) {
  const { orderId } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const configured = isSupabaseConfigured();

  if (!configured) {
    return (
      <div className="space-y-6">
        <PageIntro
          eyebrow="Pedidos"
          title="Detalle de pedido"
          description="Conecta Supabase para ver registros reales."
          backHref="/pedidos"
        />
        <SupabaseBanner />
      </div>
    );
  }

  const [settings, order] = await Promise.all([
    getBusinessSettings(),
    getOrderById(orderId),
  ]);

  if (!settings) {
    return (
      <div className="space-y-6">
        <PageIntro
          eyebrow="Pedidos"
          title="Detalle de pedido"
          description="Falta la configuracion general del negocio."
          backHref="/pedidos"
        />
        <SettingsWarning />
      </div>
    );
  }

  if (!order) {
    notFound();
  }

  const [sizeTable, payments, orderCostsResult] = await Promise.all([
    getSizeTableByOrderId(order.id),
    getPaymentsByOrderId(order.id),
    getOrderCostsByOrderId(order.id),
  ]);

  const totalPaid = getTotalPaid(payments);
  const totalCosts = getTotalOrderCosts(orderCostsResult.costs);
  const pendingAmount = order.total_amount - totalPaid;
  const estimatedProfit = order.total_amount - totalCosts;
  const updateDueDate = updateOrderDueDateAction.bind(null, order.id);
  const today = getTodayForDateInput();
  const minDueDate = today;
  const overdue = isOrderOverdue(order, today);

  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow="Pedido"
        title={order.folio}
        description="Centro operativo del pedido con resumen, items y siguientes modulos."
        backHref="/pedidos"
      />

      <OrderDetailNav />

      {resolvedSearchParams?.message === "created" ? (
        <section className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          El pedido se creo correctamente a partir de la cotizacion.
        </section>
      ) : null}
      {resolvedSearchParams?.message === "status-updated" ? (
        <section className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          El estado del pedido se actualizo correctamente.
        </section>
      ) : null}
      {resolvedSearchParams?.message === "status-error" ? (
        <section className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
          No se pudo actualizar el estado del pedido.
        </section>
      ) : null}
      {resolvedSearchParams?.message === "status-needs-down-payment" ? (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          No puedes pasar a produccion sin cubrir el anticipo requerido.
        </section>
      ) : null}
      {resolvedSearchParams?.message === "status-needs-sizes" ? (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          No puedes pasar a produccion mientras las tallas no esten completas.
        </section>
      ) : null}
      {resolvedSearchParams?.message === "due-date-updated" ? (
        <section className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          La fecha de entrega se actualizo correctamente.
        </section>
      ) : null}
      {resolvedSearchParams?.message === "due-date-error" ? (
        <section className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
          No se pudo guardar la fecha de entrega.
        </section>
      ) : null}
      {resolvedSearchParams?.message === "due-date-invalid" ? (
        <section className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
          La fecha de entrega no puede ser anterior a hoy.
        </section>
      ) : null}

      <section className="rounded-[1.75rem] border border-[var(--color-line)] bg-[var(--color-elevated)] p-5 shadow-[var(--shadow-soft)]">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,var(--color-brand-soft),var(--color-brand))] text-white shadow-[0_14px_26px_var(--color-brand-shadow)]">
            <ShoppingBag className="h-5 w-5 text-white stroke-white" />
          </div>

          <div className="min-w-0 flex-1 space-y-4">
            <div>
              <p className="text-sm font-semibold text-[var(--color-ink)]">
                {order.clients?.name || "Cliente sin nombre"}
              </p>
              <p className="mt-1 text-xs text-[var(--color-muted)]">
                Pedido {order.folio}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs text-[var(--color-muted)] md:grid-cols-4">
              <div className="rounded-2xl bg-[var(--color-panel)] px-3 py-2">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--color-soft-muted)]">
                  Folio
                </p>
                <p className="mt-1 truncate text-sm font-semibold text-[var(--color-ink)]">
                  {order.folio}
                </p>
              </div>

              <div className="rounded-2xl bg-[var(--color-panel)] px-3 py-2">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--color-soft-muted)]">
                  Tipo de venta
                </p>
                <p className="mt-1 text-sm font-semibold text-[var(--color-ink)]">
                  {order.sale_type === "factura" ? "Factura" : "Normal"}
                </p>
              </div>

              <div className="rounded-2xl bg-[var(--color-panel)] px-3 py-2">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--color-soft-muted)]">
                  Status
                </p>
                <div className="mt-1">
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-[11px] font-semibold ${getOrderStatusClasses(order.status)}`}
                  >
                    {getOrderStatusLabel(order.status)}
                  </span>
                </div>
              </div>

              <div className="rounded-2xl bg-[var(--color-panel)] px-3 py-2">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--color-soft-muted)]">
                  Fecha de creacion
                </p>
                <p className="mt-1 text-sm font-semibold text-[var(--color-ink)]">
                  {new Intl.DateTimeFormat("es-MX", {
                    dateStyle: "medium",
                  }).format(new Date(order.created_at))}
                </p>
              </div>
            </div>
          </div>
        </div>
        {overdue ? (
          <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
            Pedido atrasado: la fecha de entrega ya vencio.
          </div>
        ) : null}
      </section>

      <section className="grid gap-3 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-3">
          <article
            id="resumen"
            className="scroll-mt-32 rounded-[1.6rem] border border-[var(--color-line)] bg-[var(--color-elevated)] p-4 shadow-[var(--shadow-soft)]"
          >
            <div className="flex items-center gap-2 text-sm font-semibold text-[var(--color-ink)]">
              <Wallet className="h-4 w-4 text-[var(--color-brand)]" />
              Resumen
            </div>

            <div className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between gap-3 text-[var(--color-muted)]">
                <span>Subtotal</span>
                <span className="font-semibold text-[var(--color-ink)]">
                  {formatCurrency(order.subtotal_amount, settings.currency_code)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3 text-[var(--color-muted)]">
                <span>IVA</span>
                <span className="font-semibold text-[var(--color-ink)]">
                  {formatCurrency(order.vat_amount, settings.currency_code)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3 text-[var(--color-muted)]">
                <span>Total</span>
                <span className="font-semibold text-[var(--color-ink)]">
                  {formatCurrency(order.total_amount, settings.currency_code)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-2xl bg-[var(--color-panel)] px-4 py-3">
                <span className="text-[var(--color-muted)]">Anticipo esperado</span>
                <span className="font-semibold text-[var(--color-ink)]">
                  {formatCurrency(
                    order.expected_down_payment_amount,
                    settings.currency_code,
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3 text-[var(--color-muted)]">
                <span>Total pagado</span>
                <span className="font-semibold text-[var(--color-ink)]">
                  {formatCurrency(totalPaid, settings.currency_code)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-2xl bg-[var(--color-panel)] px-4 py-3">
                <span className="text-[var(--color-muted)]">Saldo pendiente</span>
                <span className="font-semibold text-[var(--color-ink)]">
                  {formatCurrency(pendingAmount, settings.currency_code)}
                </span>
              </div>
            </div>
          </article>

          <article className="rounded-[1.6rem] border border-[var(--color-line)] bg-[var(--color-elevated)] p-4 shadow-[var(--shadow-soft)]">
            <div className="flex items-center gap-2 text-sm font-semibold text-[var(--color-ink)]">
              <UserRound className="h-4 w-4 text-[var(--color-brand)]" />
              Cliente
            </div>
            <div className="mt-3 text-sm text-[var(--color-muted)]">
              <p className="font-semibold text-[var(--color-ink)]">
                {order.clients?.name || "Cliente sin nombre"}
              </p>
              <p>{order.clients?.phone || "Sin telefono registrado"}</p>
              {order.clients?.email ? <p>{order.clients.email}</p> : null}
            </div>
          </article>

          <article className="rounded-[1.6rem] border border-[var(--color-line)] bg-[var(--color-elevated)] p-4 shadow-[var(--shadow-soft)]">
            <div className="flex items-center gap-2 text-sm font-semibold text-[var(--color-ink)]">
              <ReceiptText className="h-4 w-4 text-[var(--color-brand)]" />
              Items del pedido
            </div>

            <div className="mt-3 space-y-3">
              {order.order_items.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-panel)] px-4 py-3"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-semibold text-[var(--color-ink)]">
                        {item.description}
                      </p>
                      <p className="text-sm font-semibold text-[var(--color-ink)]">
                        {formatCurrency(item.line_subtotal_amount, settings.currency_code)}
                      </p>
                    </div>

                    <div className="grid grid-cols-3 gap-3 text-xs text-[var(--color-muted)]">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--color-soft-muted)]">
                          Cantidad
                        </p>
                        <p className="mt-1 text-sm font-medium text-[var(--color-ink)]">
                          {item.quantity}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--color-soft-muted)]">
                          Precio unitario
                        </p>
                        <p className="mt-1 text-sm font-medium text-[var(--color-ink)]">
                          {formatCurrency(item.unit_price_amount, settings.currency_code)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--color-soft-muted)]">
                          Subtotal
                        </p>
                        <p className="mt-1 text-sm font-medium text-[var(--color-ink)]">
                          {formatCurrency(item.line_subtotal_amount, settings.currency_code)}
                        </p>
                      </div>
                    </div>

                    {item.specifications ? (
                      <div className="rounded-xl bg-[var(--color-elevated)] px-3 py-2 text-xs leading-5 text-[var(--color-muted)]">
                        <span className="font-semibold text-[var(--color-ink)]">
                          Especificaciones:
                        </span>{" "}
                        {item.specifications}
                      </div>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </article>

          <OrderSizesSection
            order={order}
            sizeTable={sizeTable}
            editRowId={resolvedSearchParams?.editRow}
            message={resolvedSearchParams?.message}
          />

          <OrderPaymentsSection
            orderId={order.id}
            totalAmount={order.total_amount}
            expectedDownPaymentAmount={order.expected_down_payment_amount}
            totalPaid={totalPaid}
            pendingAmount={pendingAmount}
            payments={payments}
            currencyCode={settings.currency_code}
            today={today}
            message={resolvedSearchParams?.message}
          />

          <OrderCostsSection
            orderId={order.id}
            orderTotal={order.total_amount}
            costs={orderCostsResult.costs}
            totalCosts={totalCosts}
            estimatedProfit={estimatedProfit}
            currencyCode={settings.currency_code}
            today={today}
            available={orderCostsResult.available}
            message={resolvedSearchParams?.message}
          />
        </div>

        <aside className="space-y-3">
          <section className="rounded-[1.6rem] border border-[var(--color-line)] bg-[var(--color-elevated)] p-4 shadow-[var(--shadow-soft)]">
            <div className="flex items-center gap-2 text-sm font-semibold text-[var(--color-ink)]">
              <ClipboardList className="h-4 w-4 text-[var(--color-brand)]" />
              Origen
            </div>
            <p className="mt-3 text-sm text-[var(--color-muted)]">
              Creado desde la cotizacion {order.quotes?.folio || "sin referencia"}.
            </p>
          </section>

          <section className="rounded-[1.6rem] border border-[var(--color-line)] bg-[var(--color-elevated)] p-4 shadow-[var(--shadow-soft)]">
            <h2 className="text-sm font-semibold text-[var(--color-ink)]">
              Fechas
            </h2>
            <div className="mt-3 space-y-2 text-sm text-[var(--color-muted)]">
              <div className="flex items-center justify-between gap-3">
                <span>Creacion</span>
                <span className="font-medium text-[var(--color-ink)]">
                  {new Intl.DateTimeFormat("es-MX", {
                    dateStyle: "medium",
                  }).format(new Date(order.created_at))}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span>Compromiso</span>
                <span className="font-medium text-[var(--color-ink)]">
                  {order.due_date
                    ? new Intl.DateTimeFormat("es-MX", {
                        dateStyle: "medium",
                      }).format(new Date(order.due_date))
                    : "Pendiente"}
                </span>
              </div>
            </div>
            <form action={updateDueDate} className="mt-4 space-y-3">
              <div>
                <label className="mb-2 block text-sm font-semibold text-[var(--color-ink)]">
                  Fecha de entrega
                </label>
                <input
                  type="date"
                  name="due_date"
                  defaultValue={order.due_date ?? ""}
                  min={minDueDate}
                  className="h-12 w-full rounded-2xl border border-[var(--color-line)] bg-[var(--color-input)] px-4 text-sm text-[var(--color-ink)] outline-none transition focus:border-[var(--color-brand)]"
                />
              </div>
              <button
                type="submit"
                className="inline-flex min-h-11 w-full items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--color-brand-soft),var(--color-brand))] px-4 text-sm font-semibold text-white shadow-[0_14px_28px_var(--color-brand-shadow)]"
              >
                <span className="text-white">
                  {order.due_date ? "Actualizar fecha" : "Guardar fecha"}
                </span>
              </button>
            </form>
          </section>

          <OrderStatusActions order={order} />
        </aside>
      </section>
    </div>
  );
}
