import Link from "next/link";
import { ShoppingBag } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { PageIntro } from "@/components/shared/page-intro";
import { SupabaseBanner } from "@/features/clients/components/supabase-banner";
import { OrderCard } from "@/features/orders/components/order-card";
import {
  canonicalOrderStatuses,
  getOrderStatusLabel,
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
  searchParams?: Promise<{ status?: string }>;
};

export default async function OrdersPage({ searchParams }: OrdersPageProps) {
  const configured = isSupabaseConfigured();
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const [settings, orders] = configured
    ? await Promise.all([getBusinessSettings(), getOrders()])
    : [null, []];
  const statusParam = resolvedSearchParams?.status;
  const selectedStatus: (typeof canonicalOrderStatuses)[number] | undefined =
    isCanonicalOrderStatus(statusParam ?? "")
    ? (statusParam as (typeof canonicalOrderStatuses)[number])
    : undefined;
  const filteredOrders = orders.filter((order) =>
    matchesOrderStatusFilter(order.status, selectedStatus),
  );
  const overdueOrders = orders.filter((order) => isOrderOverdue(order));

  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow="Pedidos"
        title="Pedidos activos"
        description="Seguimiento operativo de pedidos creados desde cotizaciones aprobadas."
      />

      {!configured ? <SupabaseBanner /> : null}
      {configured && !settings ? <SettingsWarning /> : null}

      {configured && settings && orders.length > 0 ? (
        <section className="space-y-4">
          <div className="grid gap-3 rounded-[1.6rem] border border-[var(--color-line)] bg-[var(--color-elevated)] p-4 shadow-[var(--shadow-soft)] md:grid-cols-6">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--color-soft-muted)]">
                Total
              </p>
              <p className="mt-1 text-lg font-semibold text-[var(--color-ink)]">
                {orders.length}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--color-soft-muted)]">
                Aprobados
              </p>
              <p className="mt-1 text-lg font-semibold text-[var(--color-ink)]">
                {orders.filter((order) => normalizeOrderStatus(order.status) === "aprobado").length}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--color-soft-muted)]">
                Produccion
              </p>
              <p className="mt-1 text-lg font-semibold text-[var(--color-ink)]">
                {orders.filter((order) => normalizeOrderStatus(order.status) === "en_produccion").length}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--color-soft-muted)]">
                Listos
              </p>
              <p className="mt-1 text-lg font-semibold text-[var(--color-ink)]">
                {orders.filter((order) => normalizeOrderStatus(order.status) === "listo").length}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--color-soft-muted)]">
                Entregados
              </p>
              <p className="mt-1 text-lg font-semibold text-[var(--color-ink)]">
                {orders.filter((order) => normalizeOrderStatus(order.status) === "entregado").length}
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
            {canonicalOrderStatuses.map((status) => (
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

      {configured && settings && orders.length === 0 ? (
        <EmptyState
          title="Todavia no hay pedidos"
          description="Los pedidos apareceran aqui cuando conviertas una cotizacion aprobada."
          icon={<ShoppingBag className="h-6 w-6" />}
        />
      ) : null}

      {configured && settings && orders.length > 0 && filteredOrders.length === 0 ? (
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
