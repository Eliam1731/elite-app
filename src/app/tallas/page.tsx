import { EmptyState } from "@/components/shared/empty-state";
import { PageIntro } from "@/components/shared/page-intro";
import { SupabaseBanner } from "@/features/clients/components/supabase-banner";
import { SizeOptionsTable } from "@/features/size-options/components/size-options-table";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { getSizeOptionsResult } from "@/services/size-options/queries";

type SizesPageProps = {
  searchParams?: Promise<{
    message?: string;
  }>;
};

export default async function SizesPage({ searchParams }: SizesPageProps) {
  const configured = isSupabaseConfigured();
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const message = resolvedSearchParams?.message ?? "";

  if (!configured) {
    return (
      <div className="space-y-6">
        <PageIntro
          eyebrow="Tallas"
          title="Catalogo global"
          description="Conecta Supabase para administrar las tallas validas del sistema."
          backHref="/dashboard"
        />
        <SupabaseBanner />
      </div>
    );
  }

  const { options, available } = await getSizeOptionsResult();

  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow="Tallas"
        title="Catalogo global"
        description="Administra las tallas validas del sistema. La captura real de cada cliente se sigue haciendo dentro del pedido."
        backHref="/dashboard"
      />

      {!available ? (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          La tabla `size_options` aun no existe en la base. Mientras la migracion se
          aplica, el sistema sigue usando un catalogo base temporal para no romper la
          captura dentro del pedido.
        </section>
      ) : null}

      <section className="rounded-[1.6rem] border border-[var(--color-line)] bg-[var(--color-elevated)] p-4 shadow-[var(--shadow-soft)]">
        <p className="text-sm leading-6 text-[var(--color-muted)]">
          Este modulo administra las tallas permitidas del sistema. Desde el pedido
          seguiras capturando nombre, numero y detalles de cada pieza, pero el campo
          talla saldra de este catalogo para mantener consistencia.
        </p>
      </section>

      {available && options.length > 0 ? (
        <SizeOptionsTable options={options} message={message} />
      ) : available ? (
        <div className="space-y-4">
          <SizeOptionsTable options={options} message={message} />
          <EmptyState
            title="Todavia no hay tallas"
            description="Cuando agregues tallas validas aqui, el selector del pedido las usara automaticamente."
          />
        </div>
      ) : (
        <section className="rounded-[1.6rem] border border-dashed border-[var(--color-line-strong)] bg-[var(--color-panel)] p-4">
          <p className="text-sm leading-6 text-[var(--color-muted)]">
            Aplica las migraciones de `size_options` para activar la
            administracion global desde esta pantalla. Mientras tanto, el pedido sigue
            usando un catalogo base temporal para no interrumpir la operacion.
          </p>
        </section>
      )}
    </div>
  );
}
