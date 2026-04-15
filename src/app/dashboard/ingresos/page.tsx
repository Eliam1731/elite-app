import { Wallet } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { PageIntro } from "@/components/shared/page-intro";
import { formatCurrency, formatDate } from "@/features/quotes/calculations";
import { getOrderStatusLabel } from "@/features/orders/status";
import { SupabaseBanner } from "@/features/clients/components/supabase-banner";
import { SettingsWarning } from "@/features/quotes/components/settings-warning";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { getBusinessSettings } from "@/services/business-settings/queries";
import { getMonthlyIncomeDetail } from "@/services/dashboard/queries";

export default async function DashboardIncomePage() {
  const configured = isSupabaseConfigured();

  if (!configured) {
    return (
      <div className="space-y-6">
        <PageIntro
          eyebrow="Dashboard"
          title="Ingresos del mes"
          description="Conecta Supabase para revisar el detalle."
          backHref="/dashboard"
        />
        <SupabaseBanner />
      </div>
    );
  }

  const [settings, detail] = await Promise.all([
    getBusinessSettings(),
    getMonthlyIncomeDetail(),
  ]);

  if (!settings) {
    return (
      <div className="space-y-6">
        <PageIntro
          eyebrow="Dashboard"
          title="Ingresos del mes"
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
        title="Ingresos del mes"
        description={`Pagos registrados en ${detail.monthLabel}, etiquetados segun el tipo de ingreso.`}
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
              key={item.paymentId}
              className="rounded-[1.75rem] border border-[var(--color-line)] bg-[var(--color-elevated)] p-4 shadow-[var(--shadow-soft)]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[var(--color-ink)]">
                    {item.folio}
                  </p>
                  <p className="mt-1 text-sm text-[var(--color-muted)]">
                    {item.clientName}
                  </p>
                </div>
                <p className="text-sm font-semibold text-[var(--color-ink)]">
                  {formatCurrency(item.amount, settings.currency_code)}
                </p>
              </div>

              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                <span className="rounded-full bg-emerald-100 px-3 py-1 font-semibold text-emerald-800">
                  {item.paymentTypeLabel}
                </span>
                <span className="rounded-full bg-[var(--color-panel)] px-3 py-1 text-[var(--color-muted)]">
                  {formatDate(item.paymentDate)}
                </span>
                <span className="rounded-full bg-[var(--color-panel)] px-3 py-1 text-[var(--color-muted)]">
                  {getOrderStatusLabel(item.orderStatus)}
                </span>
                {item.paymentMethod ? (
                  <span className="rounded-full bg-[var(--color-panel)] px-3 py-1 text-[var(--color-muted)]">
                    {item.paymentMethod}
                  </span>
                ) : null}
              </div>

              {item.notes ? (
                <p className="mt-3 text-sm leading-6 text-[var(--color-muted)]">
                  {item.notes}
                </p>
              ) : null}
            </article>
          ))}
        </section>
      ) : (
        <EmptyState
          icon={<Wallet className="h-6 w-6" />}
          title="Sin ingresos este mes"
          description="Aun no hay pagos registrados en el mes actual."
        />
      )}
    </div>
  );
}
