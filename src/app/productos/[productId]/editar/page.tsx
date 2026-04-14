import { notFound } from "next/navigation";

import { PageIntro } from "@/components/shared/page-intro";
import { SupabaseBanner } from "@/features/clients/components/supabase-banner";
import { updateProductAction } from "@/features/products/actions";
import { ProductForm } from "@/features/products/components/product-form";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { getProductById } from "@/services/products/queries";

type EditProductPageProps = {
  params: Promise<{ productId: string }>;
};

export default async function EditProductPage({
  params,
}: EditProductPageProps) {
  const { productId } = await params;
  const configured = isSupabaseConfigured();

  if (!configured) {
    return (
      <div className="space-y-6">
        <PageIntro
          eyebrow="Productos"
          title="Editar producto"
          description="Conecta Supabase para editar el catalogo real."
          backHref="/productos"
        />
        <SupabaseBanner />
      </div>
    );
  }

  const product = await getProductById(productId);

  if (!product) {
    notFound();
  }

  const action = updateProductAction.bind(null, productId);

  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow="Productos"
        title="Editar producto"
        description="Actualiza nombre, precio base, estatus y notas sin tocar el historico."
        backHref={`/productos/${productId}`}
      />

      <ProductForm
        action={action}
        submitLabel="Guardar cambios"
        defaultValues={{
          name: product.name,
          base_price_amount: product.base_price_amount.toFixed(2),
          capture_mode: product.capture_mode,
          notes: product.notes ?? "",
        }}
      />
    </div>
  );
}
