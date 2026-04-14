import Link from "next/link";
import { BadgeDollarSign, ClipboardList, FileText, Package2, PencilLine } from "lucide-react";
import { notFound } from "next/navigation";

import { PageIntro } from "@/components/shared/page-intro";
import { SupabaseBanner } from "@/features/clients/components/supabase-banner";
import { toggleProductActiveAction } from "@/features/products/actions";
import { formatCurrency } from "@/features/quotes/calculations";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { getBusinessSettings } from "@/services/business-settings/queries";
import { getProductById } from "@/services/products/queries";

type ProductDetailPageProps = {
  params: Promise<{ productId: string }>;
};

export default async function ProductDetailPage({
  params,
}: ProductDetailPageProps) {
  const { productId } = await params;
  const configured = isSupabaseConfigured();

  if (!configured) {
    return (
      <div className="space-y-6">
        <PageIntro
          eyebrow="Productos"
          title="Detalle de producto"
          description="Conecta Supabase para ver el catalogo real."
          backHref="/productos"
        />
        <SupabaseBanner />
      </div>
    );
  }

  const [settings, product] = await Promise.all([
    getBusinessSettings(),
    getProductById(productId),
  ]);

  if (!product) {
    notFound();
  }

  const currencyCode = settings?.currency_code ?? "MXN";
  const toggleAction = toggleProductActiveAction.bind(
    null,
    product.id,
    !product.is_active,
    `/productos/${product.id}`,
  );

  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow="Producto"
        title={product.name}
        description="Ficha simple del catalogo para revisar precio base, captura y estatus."
        backHref="/productos"
        actionHref={`/productos/${product.id}/editar`}
        actionLabel="Editar"
      />

      <section className="rounded-[2rem] border border-[var(--color-line)] bg-[var(--color-elevated)] p-5 shadow-[var(--shadow-soft)]">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-[linear-gradient(135deg,var(--color-brand-soft),var(--color-brand))] text-white shadow-[0_16px_28px_var(--color-brand-shadow)] [&_svg]:text-white [&_svg]:stroke-white">
            <Package2 className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <p className="text-lg font-semibold text-[var(--color-ink)]">
              {product.name}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex rounded-full px-3 py-1 text-[11px] font-semibold ${
                  product.is_active
                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200"
                    : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200"
                }`}
              >
                {product.is_active ? "Activo" : "Inactivo"}
              </span>
              <span className="inline-flex rounded-full bg-blue-100 px-3 py-1 text-[11px] font-semibold text-blue-800 dark:bg-blue-950/50 dark:text-blue-200">
                Captura {product.capture_mode === "simple" ? "simple" : "completa"}
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <article className="rounded-[1.6rem] border border-[var(--color-line)] bg-[var(--color-elevated)] p-4 shadow-[var(--shadow-soft)]">
          <div className="flex items-center gap-2 text-sm font-semibold text-[var(--color-ink)]">
            <BadgeDollarSign className="h-4 w-4 text-[var(--color-brand)]" />
            Precio base
          </div>
          <p className="mt-3 text-lg font-semibold text-[var(--color-ink)]">
            {formatCurrency(product.base_price_amount, currencyCode)}
          </p>
        </article>

        <article className="rounded-[1.6rem] border border-[var(--color-line)] bg-[var(--color-elevated)] p-4 shadow-[var(--shadow-soft)]">
          <div className="flex items-center gap-2 text-sm font-semibold text-[var(--color-ink)]">
            <ClipboardList className="h-4 w-4 text-[var(--color-brand)]" />
            Captura
          </div>
          <p className="mt-3 text-sm leading-6 text-[var(--color-muted)]">
            Este producto usa captura{" "}
            <span className="font-semibold text-[var(--color-ink)]">
              {product.capture_mode === "simple" ? "simple" : "completa"}
            </span>
            .
          </p>
        </article>

        <article className="rounded-[1.6rem] border border-[var(--color-line)] bg-[var(--color-elevated)] p-4 shadow-[var(--shadow-soft)]">
          <div className="flex items-center gap-2 text-sm font-semibold text-[var(--color-ink)]">
            <FileText className="h-4 w-4 text-[var(--color-brand)]" />
            Notas
          </div>
          <p className="mt-3 text-sm leading-6 text-[var(--color-muted)]">
            {product.notes || "Sin notas por ahora."}
          </p>
        </article>
      </section>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Link
          href={`/productos/${product.id}/editar`}
          className="inline-flex min-h-14 items-center justify-center gap-2 rounded-[1.4rem] bg-[linear-gradient(135deg,var(--color-brand-soft),var(--color-brand))] px-4 text-sm font-semibold text-white shadow-[0_14px_28px_var(--color-brand-shadow)] [&_svg]:text-white [&_svg]:stroke-white"
        >
          <PencilLine className="h-4 w-4" />
          <span className="text-white">Editar producto</span>
        </Link>
        <Link
          href="/cotizaciones/nueva"
          className="inline-flex min-h-14 items-center justify-center gap-2 rounded-[1.4rem] border border-[var(--color-line)] bg-[var(--color-elevated)] px-4 text-sm font-semibold text-[var(--color-ink)] shadow-[var(--shadow-soft)]"
        >
          <ClipboardList className="h-4 w-4" />
          Usar en cotizacion
        </Link>
        <form action={toggleAction}>
          <button
            type="submit"
            className={`inline-flex min-h-14 w-full items-center justify-center rounded-[1.4rem] px-4 text-sm font-semibold ${
              product.is_active
                ? "border border-amber-200 bg-amber-50 text-amber-900"
                : "bg-[linear-gradient(135deg,var(--color-brand-soft),var(--color-brand))] text-white shadow-[0_14px_28px_var(--color-brand-shadow)]"
            }`}
          >
            <span className={product.is_active ? "" : "text-white"}>
              {product.is_active ? "Desactivar producto" : "Activar producto"}
            </span>
          </button>
        </form>
      </section>
    </div>
  );
}
