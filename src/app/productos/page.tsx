import { Package2 } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { PageIntro } from "@/components/shared/page-intro";
import { SupabaseBanner } from "@/features/clients/components/supabase-banner";
import { ProductCard } from "@/features/products/components/product-card";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { getBusinessSettings } from "@/services/business-settings/queries";
import { getProducts } from "@/services/products/queries";

export default async function ProductsPage() {
  const configured = isSupabaseConfigured();

  if (!configured) {
    return (
      <div className="space-y-6">
        <PageIntro
          eyebrow="Productos"
          title="Catalogo base"
          description="Conecta Supabase para administrar el catalogo real."
          backHref="/dashboard"
        />
        <SupabaseBanner />
      </div>
    );
  }

  const [settings, products] = await Promise.all([
    getBusinessSettings(),
    getProducts(),
  ]);

  const currencyCode = settings?.currency_code ?? "MXN";

  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow="Productos"
        title="Catalogo base"
        description="Edita nombre, precio base, estatus y notas sin tocar la base de datos manualmente."
        backHref="/dashboard"
        actionHref="/productos/nuevo"
        actionLabel="Nuevo"
      />

      {products.length > 0 ? (
        <section className="space-y-3">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              currencyCode={currencyCode}
            />
          ))}
        </section>
      ) : (
        <EmptyState
          title="Todavia no hay productos"
          description="Cuando el catalogo tenga registros, aqui podras administrarlos y mantener consistencia en cotizaciones y pedidos."
          icon={<Package2 className="h-6 w-6" />}
          actionHref="/productos/nuevo"
          actionLabel="Crear producto"
        />
      )}
    </div>
  );
}
