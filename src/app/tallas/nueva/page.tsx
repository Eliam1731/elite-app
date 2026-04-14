import { PageIntro } from "@/components/shared/page-intro";
import { SupabaseBanner } from "@/features/clients/components/supabase-banner";
import { createSizeOptionAction } from "@/features/size-options/actions";
import { SizeOptionForm } from "@/features/size-options/components/size-option-form";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export default function NewSizeOptionPage() {
  const configured = isSupabaseConfigured();

  if (!configured) {
    return (
      <div className="space-y-6">
        <PageIntro
          eyebrow="Tallas"
          title="Nueva talla"
          description="Conecta Supabase para guardar el catalogo real."
          backHref="/tallas"
        />
        <SupabaseBanner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow="Tallas"
        title="Nueva talla"
        description="Agrega una talla valida para el sistema. Cuando este activa, aparecera en la captura dentro del pedido."
        backHref="/tallas"
      />

      <SizeOptionForm action={createSizeOptionAction} submitLabel="Crear talla" />
    </div>
  );
}
