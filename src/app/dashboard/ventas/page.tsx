import { ShoppingBag } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { PageIntro } from "@/components/shared/page-intro";
import { formatCurrency, formatDate } from "@/features/quotes/calculations";
import { getOrderStatusLabel } from "@/features/orders/status";
import { SupabaseBanner } from "@/features/clients/components/supabase-banner";
import { SettingsWarning } from "@/features/quotes/components/settings-warning";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { getBusinessSettings } from "@/services/business-settings/queries";
import { getMonthlySalesDetail } from "@/services/dashboard/queries";

export default async function DashboardSalesPage() {
  const configured = isSupabaseConfigured();

  if (!configured) {
    return (
      <div className="space-y-6">
        <PageIntro
          eyebrow="Dashboard"
          title="Ventas del mes"
          description="Conecta Supabase para revisar el detalle."
          backHref="/dashboard"
        />
        <SupabaseBanner />
      </div>
    );
  }

  const [settings, detail] = await Promise.all([
    getBusinessSettings(),
    getMonthlySalesDetail(),
  ]);

  if (!settings) {
    return (
      <div className="space-y-6">
        <PageIntro
          eyebrow="Dashboard"
          title="Ventas del mes"
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
        title="Ventas del mes"
        description={`Pedidos creados en ${detail.monthLabel}, excluyendo cancelados.`}
        backHref="/dashboard"
      />

      <section className="rounded-[1.75rem] border border-[var(--color-line)] bg-[var(--color-elevated)] p-4 shadow-[var(--shadow-soft)]">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--color-soft-muted)]">
          Total
        </p>
        <p className="mt-2 text-3xl font-bold text-[var(--color-ink)]">
          {formatCurrency(detail.total, settings.currency_code)}
        </p>
      </section>

      {detail.items.length ? (
        <section className="space-y-3">
          {detail.items.map((item) => (
            <article
              key={item.orderId}
              className="rounded-[1.75rem] border border-[var(--color-line)] bg-[var(--color-elevated)] p-4 shadow-[var(--shadow-soft)]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[var(--color-ink)]">{item.folio}</p>
                  <p className="mt-1 text-sm text-[var(--color-muted)]">{item.clientName}</p>
                </div>
                <p className="text-sm font-semibold text-[var(--color-ink)]">
                  {formatCurrency(item.amount, settings.currency_code)}
                </p>
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-[var(--color-muted)]">
                <span className="rounded-full bg-[var(--color-panel)] px-3 py-1">
                  {getOrderStatusLabel(item.status)}
                </span>
                {item.createdAt ? (
                  <span className="rounded-full bg-[var(--color-panel)] px-3 py-1">
                    {formatDate(item.createdAt)}
                  </span>
                ) : null}
              </div>
            </article>
          ))}
        </section>
      ) : (
        <EmptyState
          icon={<ShoppingBag className="h-6 w-6" />}
          title="Sin ventas este mes"
          description="Aun no hay pedidos activos o entregados creados en el mes actual."
        />
      )}
    </div>
  );
}
