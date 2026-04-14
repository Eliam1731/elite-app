import Link from "next/link";
import { Archive, ShoppingBag } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { PageIntro } from "@/components/shared/page-intro";
import { SupabaseBanner } from "@/features/clients/components/supabase-banner";
import { OrderCard } from "@/features/orders/components/order-card";
import {
  getOrderStatusLabel,
  isCanonicalOrderStatus,
  isClosedOrderStatus,
  matchesOrderStatusFilter,
  normalizeOrderStatus,
} from "@/features/orders/status";
import { SettingsWarning } from "@/features/quotes/components/settings-warning";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { getBusinessSettings } from "@/services/business-settings/queries";
import { getOrders } from "@/services/orders/queries";

const historicalStatuses = ["entregado", "cancelado"] as const;

type OrdersHistoryPageProps = {
  searchParams?: Promise<{ status?: string }>;
};

export default async function OrdersHistoryPage({
  searchParams,
}: OrdersHistoryPageProps) {
  const configured = isSupabaseConfigured();
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const [settings, orders] = configured
    ? await Promise.all([getBusinessSettings(), getOrders()])
    : [null, []];
  const statusParam = resolvedSearchParams?.status;
  const selectedStatus: (typeof historicalStatuses)[number] | undefined =
    isCanonicalOrderStatus(statusParam ?? "") &&
      historicalStatuses.includes(statusParam as (typeof historicalStatuses)[number])
    ? (statusParam as (typeof historicalStatuses)[number])
    : undefined;
  const historyOrders = orders.filter((order) => isClosedOrderStatus(order.status));
  const filteredOrders = historyOrders.filter((order) =>
    matchesOrderStatusFilter(order.status, selectedStatus),
  );

  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow="Pedidos"
        title="Historial"
        description="Consulta pedidos entregados o cancelados sin mezclarlos con la operacion activa."
        backHref="/pedidos"
      />

      {!configured ? <SupabaseBanner /> : null}
      {configured && !settings ? <SettingsWarning /> : null}

      {configured && settings && historyOrders.length > 0 ? (
        <section className="space-y-4">
          <div className="grid gap-3 rounded-[1.6rem] border border-[var(--color-line)] bg-[var(--color-elevated)] p-4 shadow-[var(--shadow-soft)] md:grid-cols-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--color-soft-muted)]">
                Total
              </p>
              <p className="mt-1 text-lg font-semibold text-[var(--color-ink)]">
                {historyOrders.length}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--color-soft-muted)]">
                Entregados
              </p>
              <p className="mt-1 text-lg font-semibold text-[var(--color-ink)]">
                {historyOrders.filter((order) => normalizeOrderStatus(order.status) === "entregado").length}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--color-soft-muted)]">
                Cancelados
              </p>
              <p className="mt-1 text-lg font-semibold text-[var(--color-ink)]">
                {historyOrders.filter((order) => normalizeOrderStatus(order.status) === "cancelado").length}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/pedidos/historial"
              className={`inline-flex min-h-10 items-center justify-center rounded-full px-4 text-sm font-semibold ${
                !selectedStatus
                  ? "bg-[linear-gradient(135deg,var(--color-brand-soft),var(--color-brand))] text-white shadow-[0_14px_28px_var(--color-brand-shadow)]"
                  : "border border-[var(--color-line)] bg-[var(--color-elevated)] text-[var(--color-ink)]"
              }`}
            >
              Todos
            </Link>
            {historicalStatuses.map((status) => (
              <Link
                key={status}
                href={`/pedidos/historial?status=${status}`}
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

      {configured && settings && historyOrders.length === 0 ? (
        <EmptyState
          title="Todavia no hay historial"
          description="Los pedidos entregados o cancelados apareceran aqui cuando cierres su ciclo."
          actionHref="/pedidos"
          actionLabel="Ver pedidos activos"
          icon={<Archive className="h-6 w-6" />}
        />
      ) : null}

      {configured && settings && historyOrders.length > 0 && filteredOrders.length === 0 ? (
        <EmptyState
          title="No hay pedidos en este filtro"
          description="Prueba otro filtro o vuelve al historial completo."
          actionHref="/pedidos/historial"
          actionLabel="Ver historial completo"
          icon={<ShoppingBag className="h-6 w-6" />}
        />
      ) : null}
    </div>
  );
}
