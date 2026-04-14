import Link from "next/link";
import { FileText, PencilLine, Phone, StickyNote, Wallet } from "lucide-react";
import { notFound } from "next/navigation";

import { PageIntro } from "@/components/shared/page-intro";
import { SupabaseBanner } from "@/features/clients/components/supabase-banner";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { getClientById } from "@/services/clients/queries";

type ClientDetailPageProps = {
  params: Promise<{ clientId: string }>;
};

export default async function ClientDetailPage({
  params,
}: ClientDetailPageProps) {
  const { clientId } = await params;
  const configured = isSupabaseConfigured();

  if (!configured) {
    return (
      <div className="space-y-6">
        <PageIntro
          eyebrow="Clientes"
          title="Detalle de cliente"
          description="Conecta Supabase para ver registros reales."
          backHref="/clientes"
        />
        <SupabaseBanner />
      </div>
    );
  }

  const client = await getClientById(clientId);

  if (!client) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow="Cliente"
        title={client.name}
        description="Ficha rapida para continuar luego con cotizaciones, pedidos, tallas y pagos."
        backHref="/clientes"
        actionHref={`/clientes/${client.id}/editar`}
        actionLabel="Editar"
      />

      <section className="rounded-[2rem] border border-[var(--color-line)] bg-[var(--color-elevated)] p-5 shadow-[var(--shadow-soft)]">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-[linear-gradient(135deg,var(--color-brand-soft),var(--color-brand))] font-display text-xl font-bold text-white shadow-[0_16px_28px_var(--color-brand-shadow)]">
            {client.name.slice(0, 1).toUpperCase()}
          </div>
          <div>
            <p className="text-lg font-semibold text-[var(--color-ink)]">
              {client.name}
            </p>
            <p className="text-sm text-[var(--color-muted)]">{client.phone}</p>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <article className="rounded-[1.6rem] border border-[var(--color-line)] bg-[var(--color-elevated)] p-4 shadow-[var(--shadow-soft)]">
          <div className="flex items-center gap-2 text-sm font-semibold text-[var(--color-ink)]">
            <Phone className="h-4 w-4 text-[var(--color-brand)]" />
            Contacto
          </div>
          <div className="mt-3 space-y-2 text-sm text-[var(--color-muted)]">
            <p>{client.phone}</p>
            <p>{client.email || "Sin correo registrado"}</p>
            <p>{client.address || "Sin direccion registrada"}</p>
          </div>
        </article>

        <article className="rounded-[1.6rem] border border-[var(--color-line)] bg-[var(--color-elevated)] p-4 shadow-[var(--shadow-soft)]">
          <div className="flex items-center gap-2 text-sm font-semibold text-[var(--color-ink)]">
            <FileText className="h-4 w-4 text-[var(--color-brand)]" />
            Facturacion
          </div>
          <p className="mt-3 text-sm text-[var(--color-muted)]">
            {client.rfc || "Sin RFC registrado"}
          </p>
        </article>

        <article className="rounded-[1.6rem] border border-[var(--color-line)] bg-[var(--color-elevated)] p-4 shadow-[var(--shadow-soft)]">
          <div className="flex items-center gap-2 text-sm font-semibold text-[var(--color-ink)]">
            <StickyNote className="h-4 w-4 text-[var(--color-brand)]" />
            Notas
          </div>
          <p className="mt-3 text-sm leading-6 text-[var(--color-muted)]">
            {client.notes || "Sin notas por ahora."}
          </p>
        </article>
      </section>

      <section className="grid grid-cols-2 gap-3">
        <Link
          href={`/clientes/${client.id}/editar`}
          className="inline-flex min-h-14 items-center justify-center gap-2 rounded-[1.4rem] bg-[linear-gradient(135deg,var(--color-brand-soft),var(--color-brand))] px-4 text-sm font-semibold text-white shadow-[0_14px_28px_var(--color-brand-shadow)] [&_svg]:text-white [&_svg]:stroke-white"
        >
          <PencilLine className="h-4 w-4" />
          <span className="text-white">Editar</span>
        </Link>
        <Link
          href="/cotizaciones"
          className="inline-flex min-h-14 items-center justify-center gap-2 rounded-[1.4rem] border border-[var(--color-line)] bg-[var(--color-elevated)] px-4 text-sm font-semibold text-[var(--color-ink)] shadow-[var(--shadow-soft)]"
        >
          <Wallet className="h-4 w-4" />
          Cotizar
        </Link>
      </section>
    </div>
  );
}
