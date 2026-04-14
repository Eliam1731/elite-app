import { EmptyState } from "@/components/shared/empty-state";
import { PageIntro } from "@/components/shared/page-intro";
import { SupabaseBanner } from "@/features/clients/components/supabase-banner";
import { createQuoteAction } from "@/features/quotes/actions";
import { QuoteForm } from "@/features/quotes/components/quote-form";
import { SettingsWarning } from "@/features/quotes/components/settings-warning";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { getBusinessSettings } from "@/services/business-settings/queries";
import { getClients } from "@/services/clients/queries";
import { getActiveProducts } from "@/services/products/queries";

export default async function NewQuotePage() {
  const configured = isSupabaseConfigured();

  if (!configured) {
    return (
      <div className="space-y-6">
        <PageIntro
          eyebrow="Cotizaciones"
          title="Nueva cotizacion"
          description="Conecta Supabase para trabajar con datos reales."
          backHref="/cotizaciones"
        />
        <SupabaseBanner />
      </div>
    );
  }

  const [settings, clients, products] = await Promise.all([
    getBusinessSettings(),
    getClients(),
    getActiveProducts(),
  ]);

  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow="Cotizaciones"
        title="Nueva cotizacion"
        description="Selecciona cliente, agrega items y revisa el resumen antes de guardar."
        backHref="/cotizaciones"
      />

      {!settings ? <SettingsWarning /> : null}

      {clients.length === 0 ? (
        <EmptyState
          title="Primero necesitas clientes"
          description="Para crear una cotizacion debes seleccionar un cliente existente."
          actionHref="/clientes/nuevo"
          actionLabel="Crear cliente"
        />
      ) : null}

      {settings && clients.length > 0 ? (
        <QuoteForm
          action={createQuoteAction}
          clients={clients}
          settings={settings}
          products={products}
        />
      ) : null}
    </div>
  );
}
