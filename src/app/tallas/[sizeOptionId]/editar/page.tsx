import { notFound } from "next/navigation";

import { PageIntro } from "@/components/shared/page-intro";
import { SupabaseBanner } from "@/features/clients/components/supabase-banner";
import { updateSizeOptionAction } from "@/features/size-options/actions";
import { SizeOptionForm } from "@/features/size-options/components/size-option-form";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { getSizeOptionById } from "@/services/size-options/queries";

type EditSizeOptionPageProps = {
  params: Promise<{ sizeOptionId: string }>;
};

export default async function EditSizeOptionPage({
  params,
}: EditSizeOptionPageProps) {
  const { sizeOptionId } = await params;
  const configured = isSupabaseConfigured();

  if (!configured) {
    return (
      <div className="space-y-6">
        <PageIntro
          eyebrow="Tallas"
          title="Editar talla"
          description="Conecta Supabase para editar el catalogo real."
          backHref="/tallas"
        />
        <SupabaseBanner />
      </div>
    );
  }

  const option = await getSizeOptionById(sizeOptionId);

  if (!option) {
    notFound();
  }

  const action = updateSizeOptionAction.bind(null, sizeOptionId);

  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow="Tallas"
        title="Editar talla"
        description="Ajusta la etiqueta de la talla sin afectar el historico ya capturado."
        backHref="/tallas"
      />

      <SizeOptionForm
        action={action}
        submitLabel="Guardar cambios"
        defaultValues={{
          label: option.label,
        }}
      />
    </div>
  );
}
