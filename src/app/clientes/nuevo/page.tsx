import { PageIntro } from "@/components/shared/page-intro";
import { createClientAction } from "@/features/clients/actions";
import { ClientForm } from "@/features/clients/components/client-form";
import { SupabaseBanner } from "@/features/clients/components/supabase-banner";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export default function NewClientPage() {
  const configured = isSupabaseConfigured();

  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow="Clientes"
        title="Nuevo cliente"
        description="Captura minima para operar rapido desde el celular."
        backHref="/clientes"
      />

      {!configured ? <SupabaseBanner /> : null}

      <ClientForm action={createClientAction} submitLabel="Guardar cliente" />
    </div>
  );
}
