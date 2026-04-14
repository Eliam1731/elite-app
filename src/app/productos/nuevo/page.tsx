import { PageIntro } from "@/components/shared/page-intro";
import { SupabaseBanner } from "@/features/clients/components/supabase-banner";
import { createProductAction } from "@/features/products/actions";
import { ProductForm } from "@/features/products/components/product-form";
import { isSupabaseConfigured } from "@/lib/supabase/server";

type NewProductPageProps = {
  searchParams?: Promise<{ returnTo?: string }>;
};

function getSafeReturnTo(returnTo?: string) {
  if (!returnTo || !returnTo.startsWith("/") || returnTo.startsWith("//")) {
    return null;
  }

  return returnTo;
}

export default async function NewProductPage({
  searchParams,
}: NewProductPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const returnTo = getSafeReturnTo(resolvedSearchParams?.returnTo);
  const configured = isSupabaseConfigured();

  if (!configured) {
    return (
      <div className="space-y-6">
        <PageIntro
          eyebrow="Productos"
          title="Nuevo producto"
          description="Conecta Supabase para guardar el catalogo real."
          backHref={returnTo ?? "/productos"}
        />
        <SupabaseBanner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow="Productos"
        title="Nuevo producto"
        description="Crea un producto nuevo del catalogo y define si su captura sera simple o completa."
        backHref={returnTo ?? "/productos"}
      />

      <ProductForm
        action={createProductAction}
        submitLabel="Crear producto"
        returnTo={returnTo ?? undefined}
      />
    </div>
  );
}
