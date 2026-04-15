import { CreditCard } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { PageIntro } from "@/components/shared/page-intro";
import { formatCurrency } from "@/features/quotes/calculations";
import { SupabaseBanner } from "@/features/clients/components/supabase-banner";
import { SettingsWarning } from "@/features/quotes/components/settings-warning";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { getBusinessSettings } from "@/services/business-settings/queries";
import { getPendingCollectionDetail } from "@/services/dashboard/queries";

export default async function DashboardPendingPage() {
  const configured = isSupabaseConfigured();

  if (!configured) {
    return (
      <div className="space-y-6">
        <PageIntro
          eyebrow="Dashboard"
          title="Pendiente por cobrar"
          description="Conecta Supabase para revisar el detalle."
          backHref="/dashboard"
        />
        <SupabaseBanner />
      </div>
    );
  }

  const [settings, detail] = await Promise.all([
    getBusinessSettings(),
    getPendingCollectionDetail(),
  ]);

  if (!settings) {
    return (
      <div className="space-y-6">
        <PageIntro
          eyebrow="Dashboard"
          title="Pendiente por cobrar"
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
        title="Pendiente por cobrar"
        description="Saldo real por pedido, excluyendo cancelados."
        backHref="/dashboard"
      />

      <section className="rounded-[1.75rem] border border-[var(--color-line)] bg-[var(--color-elevated)] p-4 shadow-[var(--shadow-soft)]">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--color-soft-muted)]">
          Total pendiente
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
                <span className="rounded-full bg-[var(--color-panel)] px-3 py-1 text-xs text-[var(--color-muted)]">
                  {item.statusLabel}
                </span>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl bg-[var(--color-panel)] px-4 py-3">
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--color-soft-muted)]">
                    Total
                  </p>
                  <p className="mt-1 text-lg font-semibold text-[var(--color-ink)]">
                    {formatCurrency(item.totalAmount, settings.currency_code)}
                  </p>
                </div>
                <div className="rounded-2xl bg-[var(--color-panel)] px-4 py-3">
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--color-soft-muted)]">
                    Pagado
                  </p>
                  <p className="mt-1 text-lg font-semibold text-[var(--color-ink)]">
                    {formatCurrency(item.paidAmount, settings.currency_code)}
                  </p>
                </div>
                <div className="rounded-2xl bg-[var(--color-panel)] px-4 py-3">
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--color-soft-muted)]">
                    Pendiente
                  </p>
                  <p className="mt-1 text-lg font-semibold text-[var(--color-ink)]">
                    {formatCurrency(item.pendingAmount, settings.currency_code)}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </section>
      ) : (
        <EmptyState
          icon={<CreditCard className="h-6 w-6" />}
          title="Sin saldo pendiente"
          description="No hay pedidos con dinero pendiente por cobrar."
        />
      )}
    </div>
  );
}
