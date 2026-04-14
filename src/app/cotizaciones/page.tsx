import { FileText } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { PageIntro } from "@/components/shared/page-intro";
import { SupabaseBanner } from "@/features/clients/components/supabase-banner";
import { QuoteCard } from "@/features/quotes/components/quote-card";
import { SettingsWarning } from "@/features/quotes/components/settings-warning";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { getBusinessSettings } from "@/services/business-settings/queries";
import { getQuotes } from "@/services/quotes/queries";

export default async function QuotesPage() {
  const configured = isSupabaseConfigured();
  const settings = configured ? await getBusinessSettings() : null;
  const quotes = configured ? await getQuotes() : [];

  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow="Cotizaciones"
        title="Cotizaciones activas"
        description="Crea cotizaciones con multiples items, calculo automatico de IVA y anticipo sugerido."
        actionHref="/cotizaciones/nueva"
        actionLabel="Nueva"
      />

      {!configured ? <SupabaseBanner /> : null}
      {configured && !settings ? <SettingsWarning /> : null}

      {configured && settings && quotes.length > 0 ? (
        <section className="space-y-4">
          <div className="grid gap-3 rounded-[1.6rem] border border-[var(--color-line)] bg-[var(--color-elevated)] p-4 shadow-[var(--shadow-soft)] md:grid-cols-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--color-soft-muted)]">
                Total
              </p>
              <p className="mt-1 text-lg font-semibold text-[var(--color-ink)]">
                {quotes.length}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--color-soft-muted)]">
                Borrador
              </p>
              <p className="mt-1 text-lg font-semibold text-[var(--color-ink)]">
                {quotes.filter((quote) => quote.status === "draft").length}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--color-soft-muted)]">
                Enviadas
              </p>
              <p className="mt-1 text-lg font-semibold text-[var(--color-ink)]">
                {quotes.filter((quote) => quote.status === "sent").length}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--color-soft-muted)]">
                Aprobadas
              </p>
              <p className="mt-1 text-lg font-semibold text-[var(--color-ink)]">
                {quotes.filter((quote) => quote.status === "approved").length}
              </p>
            </div>
          </div>

          <section className="grid gap-3 xl:grid-cols-2">
          {quotes.map((quote) => (
            <QuoteCard
              key={quote.id}
              quote={quote}
              currencyCode={settings.currency_code}
            />
          ))}
          </section>
        </section>
      ) : null}

      {configured && settings && quotes.length === 0 ? (
        <EmptyState
          title="Todavia no hay cotizaciones"
          description="Empieza con una cotizacion nueva. El sistema calculara subtotal, IVA, total y anticipo sugerido."
          actionHref="/cotizaciones/nueva"
          actionLabel="Crear cotizacion"
          icon={<FileText className="h-6 w-6" />}
        />
      ) : null}
    </div>
  );
}
