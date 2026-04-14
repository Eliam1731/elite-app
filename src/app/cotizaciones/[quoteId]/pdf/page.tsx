import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";

import { PageIntro } from "@/components/shared/page-intro";
import {
  QuotePdfPrintButton,
  QuotePdfPrintTrigger,
} from "@/features/quotes/components/quote-pdf-print-trigger";
import {
  buildDocumentFilename,
  formatCurrency,
  formatDate,
  roundCurrency,
} from "@/features/quotes/calculations";
import { SupabaseBanner } from "@/features/clients/components/supabase-banner";
import { SettingsWarning } from "@/features/quotes/components/settings-warning";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { getBusinessSettings } from "@/services/business-settings/queries";
import { getQuoteById } from "@/services/quotes/queries";

type QuotePdfPageProps = {
  params: Promise<{ quoteId: string }>;
  searchParams?: Promise<{ download?: string }>;
};

const saleTypeLabel = {
  normal: "Venta normal",
  factura: "Con factura",
} as const;

const statusLabel = {
  draft: "Borrador",
  sent: "Enviada",
  approved: "Aprobada",
  rejected: "Rechazada",
} as const;

const quoteTerms = [
  "Tiempo estimado de entrega sujeto a confirmacion de produccion y materiales.",
  "Se requiere anticipo para iniciar produccion del pedido.",
  "Es responsabilidad del cliente revisar tallas, nombres y numeros antes de autorizar.",
  "La liquidacion restante debe quedar cubierta antes de la entrega final.",
] as const;

export async function generateMetadata({
  params,
}: QuotePdfPageProps): Promise<Metadata> {
  const { quoteId } = await params;
  const quote = await getQuoteById(quoteId);

  if (!quote) {
    return {
      title: "cotizacion.pdf",
    };
  }

  return {
    title: buildDocumentFilename({
      clientName: quote.clients?.name || "cliente",
      date: quote.created_at,
      documentType: "cotizacion",
    }),
  };
}

export default async function QuotePdfPage({
  params,
  searchParams,
}: QuotePdfPageProps) {
  const { quoteId } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const configured = isSupabaseConfigured();

  if (!configured) {
    return (
      <div className="space-y-6">
        <PageIntro
          eyebrow="Cotizacion"
          title="PDF de cotizacion"
          description="Conecta Supabase para generar el documento."
          backHref={`/cotizaciones/${quoteId}`}
        />
        <SupabaseBanner />
      </div>
    );
  }

  const [settings, quote] = await Promise.all([
    getBusinessSettings(),
    getQuoteById(quoteId),
  ]);

  if (!settings) {
    return (
      <div className="space-y-6">
        <PageIntro
          eyebrow="Cotizacion"
          title="PDF de cotizacion"
          description="Falta la configuracion general del negocio."
          backHref={`/cotizaciones/${quoteId}`}
        />
        <SettingsWarning />
      </div>
    );
  }

  if (!quote) {
    notFound();
  }

  const filename = buildDocumentFilename({
    clientName: quote.clients?.name || "cliente",
    date: quote.created_at,
    documentType: "cotizacion",
  });
  const autoPrint = resolvedSearchParams?.download === "1";
  const businessContacts: string[] = [];

  return (
    <div className="space-y-6 print:space-y-0">
      <QuotePdfPrintTrigger autoPrint={autoPrint} />

      <div className="print:hidden">
        <PageIntro
          eyebrow="Cotizacion"
          title="Vista PDF"
          description="Previsualiza la cotizacion dentro de la app y guardala como PDF sin salir de la experiencia."
          backHref={`/cotizaciones/${quote.id}`}
        />
      </div>

      <section className="rounded-[1.75rem] border border-[var(--color-line)] bg-[var(--color-elevated)] p-4 shadow-[var(--shadow-soft)] print:hidden">
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href={`/cotizaciones/${quote.id}`}
            className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-full border border-[var(--color-line)] bg-[var(--color-panel)] px-4 text-sm font-semibold text-[var(--color-ink)]"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a cotizacion
          </Link>
          <div className="flex-1">
            <QuotePdfPrintButton />
          </div>
        </div>
        <p className="mt-3 rounded-2xl bg-[var(--color-panel)] px-4 py-3 text-sm text-[var(--color-muted)]">
          Nombre sugerido del archivo:{" "}
          <span className="font-semibold text-[var(--color-ink)]">{filename}</span>
        </p>
      </section>

      <article className="mx-auto w-full max-w-4xl overflow-hidden rounded-[2rem] border border-[#BFD4FF] bg-[#EEF4FF] text-[#111827] shadow-[0_28px_56px_rgba(15,23,42,0.22)] print:max-w-none print:rounded-none print:border-0 print:bg-white print:shadow-none">
        <div className="bg-gradient-to-r from-[#0F3FB3] via-[#1D4ED8] to-[#2563EB] px-6 py-8 text-white">
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-[5rem] w-[5rem] shrink-0 items-center justify-center overflow-hidden rounded-[1.45rem] bg-white p-2.5 shadow-[0_14px_30px_rgba(15,23,42,0.26)]">
                <Image
                  src="/logo.png"
                  alt="Elite"
                  width={64}
                  height={64}
                  unoptimized
                  className="h-16 w-16 object-contain"
                />
              </div>
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.32em] text-white/80">
                  Elite
                </p>
                <h1 className="mt-2 text-[2.15rem] font-black tracking-tight text-white">
                  {settings.business_name}
                </h1>
                <p className="mt-1 text-sm font-semibold text-white">
                  Uniformes deportivos personalizados
                </p>
                {businessContacts.length ? (
                  <div className="mt-3 space-y-1 text-sm text-white/82">
                    {businessContacts.map((item) => (
                      <p key={item}>{item}</p>
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 max-w-xl text-sm leading-6 text-white/88">
                    Documento comercial de Elite preparado para presentar una propuesta
                    clara, visual y lista para compartir con el cliente.
                  </p>
                )}
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-white/20 bg-white/98 px-5 py-4 text-[#111827] shadow-[0_14px_28px_rgba(15,23,42,0.18)] md:min-w-[15rem]">
              <p className="text-[11px] font-black uppercase tracking-[0.28em] text-[#1D4ED8]">
                COTIZACION
              </p>
              <div className="mt-4 space-y-3 text-sm">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#4B5563]">
                    Folio
                  </p>
                  <p className="mt-1 text-base font-bold text-[#111827]">{quote.folio}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#4B5563]">
                    Fecha
                  </p>
                  <p className="mt-1 font-medium text-[#111827]">{formatDate(quote.created_at)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[#EEF4FF] px-6 py-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <section className="rounded-[1.5rem] border border-[#D7E5FF] bg-white px-4 py-4 shadow-[0_10px_20px_rgba(37,99,235,0.06)]">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#1E3A8A]">
                Cliente
              </p>
              <p className="mt-2 text-base font-black text-[#111827]">
                {quote.clients?.name || "Cliente sin nombre"}
              </p>
              <p className="mt-1 text-sm text-[#4B5563]">
                Telefono: {quote.clients?.phone || "Sin telefono registrado"}
              </p>
              <p className="mt-1 text-sm text-[#4B5563]">
                Correo: {quote.clients?.email || "Sin correo registrado"}
              </p>
            </section>

            <section className="rounded-[1.5rem] border border-[#D7E5FF] bg-white px-4 py-4 shadow-[0_10px_20px_rgba(37,99,235,0.06)]">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#1E3A8A]">
                Venta
              </p>
              <p className="mt-2 text-base font-black text-[#111827]">
                {saleTypeLabel[quote.sale_type]}
              </p>
              <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.18em] text-[#4B5563]">
                Estatus
              </p>
              <p className="mt-1 inline-flex rounded-full bg-[#DBEAFE] px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-[#1D4ED8]">
                {statusLabel[quote.status]}
              </p>
            </section>

            <section className="rounded-[1.5rem] border border-[#D7E5FF] bg-white px-4 py-4 shadow-[0_10px_20px_rgba(37,99,235,0.06)] md:col-span-2 xl:col-span-1">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#1E3A8A]">
                Notas
              </p>
              <p className="mt-2 text-sm leading-6 text-[#4B5563]">
                {quote.notes || "Sin notas adicionales para esta cotizacion."}
              </p>
            </section>
          </div>

          <section className="mt-6">
            <div className="overflow-hidden rounded-[1.8rem] border border-[#CFE0FF] bg-white shadow-[0_14px_28px_rgba(29,78,216,0.08)]">
              <table className="w-full border-collapse text-left text-sm">
                <thead className="bg-[#DCE9FF] text-[#0F172A]">
                  <tr>
                    <th className="px-4 py-3.5 font-black">Concepto</th>
                    <th className="px-4 py-3.5 font-black">Cantidad</th>
                    <th className="px-4 py-3.5 font-black">Precio unitario</th>
                    <th className="px-4 py-3.5 text-right font-black">Importe</th>
                  </tr>
                </thead>
                <tbody>
                  {quote.quote_items.map((item, index) => (
                    <tr
                      key={item.id}
                      className={
                        index % 2 === 0
                          ? "border-t border-[#E5E7EB] bg-white"
                          : "border-t border-[#E5E7EB] bg-[#F6F9FF]"
                      }
                    >
                      <td className="px-4 py-4 align-top">
                        <p className="font-black text-[#111827]">{item.description}</p>
                        {item.specifications ? (
                          <p className="mt-1 text-xs leading-5 text-[#4B5563]">
                            {item.specifications}
                          </p>
                        ) : null}
                      </td>
                      <td className="px-4 py-4 align-top font-medium text-[#374151]">
                        {item.quantity}
                      </td>
                      <td className="px-4 py-4 align-top font-medium text-[#374151]">
                        {formatCurrency(item.unit_price_amount, settings.currency_code)}
                      </td>
                      <td className="px-4 py-4 text-right align-top font-black text-[#111827]">
                        {formatCurrency(item.line_subtotal_amount, settings.currency_code)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <section className="rounded-[1.8rem] border border-[#D7E5FF] bg-white px-5 py-5 shadow-[0_12px_24px_rgba(37,99,235,0.06)]">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#1E3A8A]">
                Condiciones
              </p>
              <div className="mt-4 space-y-3">
                {quoteTerms.map((term, index) => (
                  <div key={term} className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#1D4ED8] text-xs font-black text-white shadow-[0_8px_16px_rgba(29,78,216,0.24)]">
                      {index + 1}
                    </div>
                    <p className="text-sm leading-6 text-[#374151]">{term}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-[1.8rem] border border-[#AAC8FF] bg-[#F8FBFF] px-5 py-5 shadow-[0_20px_36px_rgba(29,78,216,0.14)]">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#1E3A8A]">
                Resumen final
              </p>
              <div className="mt-4 space-y-3 text-sm">
                <div className="flex items-center justify-between gap-3 text-[#374151]">
                  <span>Subtotal</span>
                  <span className="font-bold text-[#111827]">
                    {formatCurrency(quote.subtotal_amount, settings.currency_code)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3 text-[#374151]">
                  <span>IVA</span>
                  <span className="font-bold text-[#111827]">
                    {formatCurrency(quote.vat_amount, settings.currency_code)}
                  </span>
                </div>
                <div className="rounded-[1.45rem] border border-[#1D4ED8] bg-gradient-to-r from-[#1E40AF] to-[#2563EB] px-4 py-5 text-white shadow-[0_18px_32px_rgba(29,78,216,0.28)]">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/78">
                    Total
                  </p>
                  <div className="mt-2 flex items-end justify-between gap-3">
                    <span className="text-sm font-semibold text-white/92">
                      Importe final de la cotizacion
                    </span>
                    <span className="text-[2.1rem] font-black leading-none text-white">
                      {formatCurrency(quote.total_amount, settings.currency_code)}
                    </span>
                  </div>
                </div>
                <div className="rounded-2xl border border-[#D7E5FF] bg-white px-4 py-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#4B5563]">
                    Anticipo sugerido
                  </p>
                  <p className="mt-1 text-xl font-black text-[#0F172A]">
                    {formatCurrency(
                      roundCurrency(quote.suggested_down_payment_amount),
                      settings.currency_code,
                    )}
                  </p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </article>
    </div>
  );
}
