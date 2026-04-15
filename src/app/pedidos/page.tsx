import Link from "next/link";
import { ShoppingBag } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { PageIntro } from "@/components/shared/page-intro";
import { SupabaseBanner } from "@/features/clients/components/supabase-banner";
import { OrderCard } from "@/features/orders/components/order-card";
import {
  canonicalOrderStatuses,
  getOrderStatusLabel,
  isClosedOrderStatus,
  isCanonicalOrderStatus,
  isOrderOverdue,
  matchesOrderStatusFilter,
  normalizeOrderStatus,
} from "@/features/orders/status";
import { SettingsWarning } from "@/features/quotes/components/settings-warning";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { getBusinessSettings } from "@/services/business-settings/queries";
import { getOrders } from "@/services/orders/queries";

type OrdersPageProps = {
  searchParams?: Promise<{ status?: string; message?: string }>;
};

export default async function OrdersPage({ searchParams }: OrdersPageProps) {
  const configured = isSupabaseConfigured();
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const [settings, orders] = configured
    ? await Promise.all([getBusinessSettings(), getOrders()])
    : [null, []];
  const activeOrderStatuses = canonicalOrderStatuses.filter(
    (status) => status !== "entregado" && status !== "cancelado",
  );
  const statusParam = resolvedSearchParams?.status;
  const selectedStatus: (typeof activeOrderStatuses)[number] | undefined =
    isCanonicalOrderStatus(statusParam ?? "") &&
      activeOrderStatuses.includes(statusParam as (typeof activeOrderStatuses)[number])
    ? (statusParam as (typeof activeOrderStatuses)[number])
    : undefined;
  const activeOrders = orders.filter((order) => !isClosedOrderStatus(order.status));
  const filteredOrders = activeOrders.filter((order) =>
    matchesOrderStatusFilter(order.status, selectedStatus),
  );
  const overdueOrders = activeOrders.filter((order) => isOrderOverdue(order));

  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow="Pedidos"
        title="Pedidos activos"
        description="Seguimiento operativo de pedidos creados desde cotizaciones aprobadas."
        actionHref="/pedidos/historial"
        actionLabel="Ver historial"
      />

      {!configured ? <SupabaseBanner /> : null}
      {configured && !settings ? <SettingsWarning /> : null}
      {resolvedSearchParams?.message === "order-deleted" ? (
        <section className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          El pedido se elimino correctamente.
        </section>
      ) : null}

      {configured && settings && activeOrders.length > 0 ? (
        <section className="space-y-4">
          <div className="grid gap-3 rounded-[1.6rem] border border-[var(--color-line)] bg-[var(--color-elevated)] p-4 shadow-[var(--shadow-soft)] md:grid-cols-5">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--color-soft-muted)]">
                Total
              </p>
              <p className="mt-1 text-lg font-semibold text-[var(--color-ink)]">
                {activeOrders.length}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--color-soft-muted)]">
                Aprobados
              </p>
              <p className="mt-1 text-lg font-semibold text-[var(--color-ink)]">
                {activeOrders.filter((order) => normalizeOrderStatus(order.status) === "aprobado").length}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--color-soft-muted)]">
                Produccion
              </p>
              <p className="mt-1 text-lg font-semibold text-[var(--color-ink)]">
                {activeOrders.filter((order) => normalizeOrderStatus(order.status) === "en_produccion").length}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--color-soft-muted)]">
                Listos
              </p>
              <p className="mt-1 text-lg font-semibold text-[var(--color-ink)]">
                {activeOrders.filter((order) => normalizeOrderStatus(order.status) === "listo").length}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--color-soft-muted)]">
                Atrasados
              </p>
              <p className="mt-1 text-lg font-semibold text-[var(--color-ink)]">
                {overdueOrders.length}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/pedidos"
              className={`inline-flex min-h-10 items-center justify-center rounded-full px-4 text-sm font-semibold ${
                !selectedStatus
                  ? "bg-[linear-gradient(135deg,var(--color-brand-soft),var(--color-brand))] text-white shadow-[0_14px_28px_var(--color-brand-shadow)]"
                  : "border border-[var(--color-line)] bg-[var(--color-elevated)] text-[var(--color-ink)]"
              }`}
            >
              Todos
            </Link>
            {activeOrderStatuses.map((status) => (
              <Link
                key={status}
                href={`/pedidos?status=${status}`}
                className={`inline-flex min-h-10 items-center justify-center rounded-full px-4 text-sm font-semibold ${
                  selectedStatus === status
                    ? "bg-[linear-gradient(135deg,var(--color-brand-soft),var(--color-brand))] text-white shadow-[0_14px_28px_var(--color-brand-shadow)]"
                    : "border border-[var(--color-line)] bg-[var(--color-elevated)] text-[var(--color-ink)]"
                }`}
              >
                {getOrderStatusLabel(status)}
              </Link>
            ))}
          </div>

          <section className="grid gap-3 xl:grid-cols-2">
            {filteredOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                currencyCode={settings.currency_code}
              />
            ))}
          </section>
        </section>
      ) : null}

      {configured && settings && activeOrders.length === 0 ? (
        <EmptyState
          title="No hay pedidos activos"
          description="Los pedidos entregados y cancelados ya viven en historial. Aqui solo veras los que siguen en proceso."
          actionHref="/pedidos/historial"
          actionLabel="Abrir historial"
          icon={<ShoppingBag className="h-6 w-6" />}
        />
      ) : null}

      {configured && settings && activeOrders.length > 0 && filteredOrders.length === 0 ? (
        <EmptyState
          title="No hay pedidos en este estado"
          description="Prueba otro filtro o vuelve a todos para revisar el flujo completo."
          actionHref="/pedidos"
          actionLabel="Ver todos"
          icon={<ShoppingBag className="h-6 w-6" />}
        />
      ) : null}
    </div>
  );
}
