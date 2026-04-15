import { ArrowDownLeft, ArrowUpRight, ShoppingBag } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { PageIntro } from "@/components/shared/page-intro";
import { formatCurrency, formatDate } from "@/features/quotes/calculations";
import { SupabaseBanner } from "@/features/clients/components/supabase-banner";
import { SettingsWarning } from "@/features/quotes/components/settings-warning";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { getBusinessSettings } from "@/services/business-settings/queries";
import { getMonthlySalesDetail } from "@/services/dashboard/queries";

function getSalesTagStyles(item: {
  kind: "income" | "expense";
  paymentType?: "down_payment" | "partial" | "final";
}) {
  if (item.kind === "expense") {
    return "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-200";
  }

  switch (item.paymentType) {
    case "down_payment":
      return "bg-sky-100 text-sky-800 dark:bg-sky-950/40 dark:text-sky-200";
    case "partial":
      return "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200";
    case "final":
      return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200";
    default:
      return "bg-[var(--color-panel)] text-[var(--color-muted)]";
  }
}

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
        description={`Flujo real de dinero de ${detail.monthLabel}: ingresos de pagos menos gastos de envio.`}
        backHref="/dashboard"
      />

      <section className="rounded-[1.75rem] border border-[var(--color-line)] bg-[var(--color-elevated)] p-4 shadow-[var(--shadow-soft)]">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--color-soft-muted)]">
          Flujo neto
        </p>
        <p className="mt-2 text-3xl font-bold text-[var(--color-ink)]">
          {formatCurrency(detail.total, settings.currency_code)}
        </p>
      </section>

      {detail.items.length ? (
        <section className="space-y-3">
          {detail.items.map((item) => {
            const isIncome = item.kind === "income";

            return (
              <article
                key={item.id}
                className="rounded-[1.75rem] border border-[var(--color-line)] bg-[var(--color-elevated)] p-4 shadow-[var(--shadow-soft)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
                        isIncome
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200"
                          : "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-200"
                      }`}
                    >
                      {isIncome ? (
                        <ArrowDownLeft className="h-5 w-5" />
                      ) : (
                        <ArrowUpRight className="h-5 w-5" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[var(--color-ink)]">
                        {isIncome
                          ? item.folio
                          : item.folio
                            ? `${item.folio} - Gasto de envio`
                            : "Gasto de envio"}
                      </p>
                      <p className="mt-1 text-sm text-[var(--color-muted)]">
                        {isIncome
                          ? item.clientName
                          : item.clientName || "Sin pedido asociado"}
                      </p>
                    </div>
                  </div>
                  <p
                    className={`text-sm font-semibold ${
                      isIncome
                        ? "text-emerald-700 dark:text-emerald-200"
                        : "text-rose-700 dark:text-rose-200"
                    }`}
                  >
                    {isIncome ? "" : "-"}
                    {formatCurrency(item.amount, settings.currency_code)}
                  </p>
                </div>

                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full bg-[var(--color-panel)] px-3 py-1 text-[var(--color-muted)]">
                    {formatDate(item.eventDate)}
                  </span>
                  <span
                    className={`rounded-full px-3 py-1 font-semibold ${getSalesTagStyles(
                      isIncome
                        ? { kind: "income", paymentType: item.paymentType }
                        : { kind: "expense" },
                    )}`}
                  >
                    {isIncome ? item.paymentTypeLabel : "Gasto de envio"}
                  </span>
                </div>

                {item.notes ? (
                  <p className="mt-3 text-sm leading-6 text-[var(--color-muted)]">
                    {item.notes}
                  </p>
                ) : null}
              </article>
            );
          })}
        </section>
      ) : (
        <EmptyState
          icon={<ShoppingBag className="h-6 w-6" />}
          title="Sin movimiento este mes"
          description="Aun no hay ingresos ni gastos de envio registrados en el mes actual."
        />
      )}
    </div>
  );
}
