import Link from "next/link";
import { Download, FileText, MessageCircle, ReceiptText, UserRound } from "lucide-react";
import { notFound } from "next/navigation";

import { ConfirmSubmitButton } from "@/components/shared/confirm-submit-button";
import { PageIntro } from "@/components/shared/page-intro";
import {
  approveQuoteAction,
  createOrderFromQuoteAction,
  deleteQuoteAction,
  rejectQuoteAction,
  sendQuoteAction,
} from "@/features/quotes/actions";
import {
  COMMERCIAL_DOWN_PAYMENT_PERCENT_LABEL,
  buildDocumentFilename,
  formatCurrency,
  getCommercialDownPaymentAmount,
} from "@/features/quotes/calculations";
import { getQuoteWhatsAppLink } from "@/features/quotes/whatsapp";
import { SupabaseBanner } from "@/features/clients/components/supabase-banner";
import { SettingsWarning } from "@/features/quotes/components/settings-warning";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { getBusinessSettings } from "@/services/business-settings/queries";
import { getOrderIdByQuoteId } from "@/services/orders/queries";
import { getQuoteById } from "@/services/quotes/queries";

type QuoteDetailPageProps = {
  params: Promise<{ quoteId: string }>;
  searchParams?: Promise<{ message?: string; detail?: string }>;
};

const statusLabel = {
  draft: "Borrador",
  sent: "Enviada",
  approved: "Aprobada",
  rejected: "Rechazada",
} as const;

export default async function QuoteDetailPage({
  params,
  searchParams,
}: QuoteDetailPageProps) {
  const { quoteId } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const configured = isSupabaseConfigured();

  if (!configured) {
    return (
      <div className="space-y-6">
        <PageIntro
          eyebrow="Cotizaciones"
          title="Detalle de cotizacion"
          description="Conecta Supabase para ver registros reales."
          backHref="/cotizaciones"
        />
        <SupabaseBanner />
      </div>
    );
  }

  const [settings, quote, existingOrderId] = await Promise.all([
    getBusinessSettings(),
    getQuoteById(quoteId),
    getOrderIdByQuoteId(quoteId),
  ]);

  if (!settings) {
    return (
      <div className="space-y-6">
        <PageIntro
          eyebrow="Cotizaciones"
          title="Detalle de cotizacion"
          description="Falta la configuracion general del negocio."
          backHref="/cotizaciones"
        />
        <SettingsWarning />
      </div>
    );
  }

  if (!quote) {
    notFound();
  }

  const sendAction = sendQuoteAction.bind(null, quote.id);
  const approveAction = approveQuoteAction.bind(null, quote.id);
  const rejectAction = rejectQuoteAction.bind(null, quote.id);
  const createOrderAction = createOrderFromQuoteAction.bind(null, quote.id);
  const deleteAction = deleteQuoteAction.bind(null, quote.id);
  const futurePdfFilename = buildDocumentFilename({
    clientName: quote.clients?.name || "cliente",
    date: quote.created_at,
    documentType: "cotizacion",
  });
  const suggestedDownPaymentAmount = getCommercialDownPaymentAmount(quote.total_amount);
  const whatsappHref = getQuoteWhatsAppLink(quote, settings.currency_code);
  const canDeleteQuote = !existingOrderId;

  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow="Cotizacion"
        title={quote.folio}
        description="Resumen completo de cliente, items e importes."
        backHref="/cotizaciones"
      />

      {resolvedSearchParams?.message === "sent" ? (
        <section className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          La cotizacion se marco como enviada.
        </section>
      ) : null}
      {resolvedSearchParams?.message === "approved" ? (
        <section className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          La cotizacion se aprobo correctamente.
        </section>
      ) : null}
      {resolvedSearchParams?.message === "rejected" ? (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          La cotizacion se marco como rechazada.
        </section>
      ) : null}
      {resolvedSearchParams?.message === "send-error" ? (
        <section className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
          No se pudo marcar la cotizacion como enviada.
        </section>
      ) : null}
      {resolvedSearchParams?.message === "approve-error" ? (
        <section className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
          No se pudo aprobar la cotizacion.
        </section>
      ) : null}
      {resolvedSearchParams?.message === "reject-error" ? (
        <section className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
          No se pudo rechazar la cotizacion.
        </section>
      ) : null}
      {resolvedSearchParams?.message === "not-approved" ? (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Primero debes aprobar la cotizacion para crear el pedido.
        </section>
      ) : null}
      {resolvedSearchParams?.message === "order-error" ||
      resolvedSearchParams?.message === "order-items-error" ? (
        <section className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
          No se pudo crear el pedido a partir de la cotizacion.
          {resolvedSearchParams?.detail ? (
            <p className="mt-2 text-xs leading-5 text-rose-800">
              Detalle: {resolvedSearchParams.detail}
            </p>
          ) : null}
        </section>
      ) : null}
      {resolvedSearchParams?.message === "settings-missing" ? (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Falta la configuracion del negocio para completar esta accion.
        </section>
      ) : null}
      {resolvedSearchParams?.message === "quote-missing" ? (
        <section className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
          No se pudo cargar la cotizacion para crear el pedido.
          {resolvedSearchParams?.detail ? (
            <p className="mt-2 text-xs leading-5 text-rose-800">
              Detalle: {resolvedSearchParams.detail}
            </p>
          ) : null}
        </section>
      ) : null}
      {resolvedSearchParams?.message === "delete-blocked-order" ? (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          No se puede borrar la cotizacion porque ya fue convertida en pedido.
        </section>
      ) : null}
      {resolvedSearchParams?.message === "delete-error" ? (
        <section className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
          No se pudo eliminar la cotizacion.
        </section>
      ) : null}

      <section className="rounded-[1.75rem] border border-[var(--color-line)] bg-[var(--color-elevated)] p-5 shadow-[var(--shadow-soft)]">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,var(--color-brand-soft),var(--color-brand))] text-white shadow-[0_14px_26px_var(--color-brand-shadow)]">
            <FileText className="h-5 w-5 text-white stroke-white" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-[var(--color-ink)]">
                  {quote.folio}
                </p>
                <p className="mt-1 text-sm text-[var(--color-muted)]">
                  {quote.sale_type === "factura" ? "Con factura" : "Venta normal"}
                </p>
              </div>
              <span className="rounded-full bg-[var(--color-panel)] px-3 py-1 text-[11px] font-semibold text-[var(--color-brand)]">
                {statusLabel[quote.status]}
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[1.6rem] border border-[var(--color-line)] bg-[var(--color-elevated)] p-4 shadow-[var(--shadow-soft)]">
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href={`/cotizaciones/${quote.id}/pdf`}
            className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-full border border-[var(--color-line)] bg-[var(--color-panel)] px-4 text-sm font-semibold text-[var(--color-ink)]"
          >
            <Download className="h-4 w-4" />
            Ver PDF
          </Link>

          {whatsappHref ? (
            <Link
              href={whatsappHref}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-full border border-[#128C7E] bg-[linear-gradient(135deg,#25D366,#128C7E)] px-4 text-sm font-semibold text-white shadow-[0_16px_30px_rgba(18,140,126,0.28)] transition hover:brightness-[1.03] [&_svg]:text-white [&_svg]:stroke-white"
            >
              <MessageCircle className="h-4 w-4" />
              Enviar por WhatsApp
            </Link>
          ) : (
            <div className="inline-flex min-h-12 flex-1 items-center justify-center rounded-full border border-dashed border-[var(--color-line-strong)] bg-[var(--color-panel)] px-4 text-sm font-semibold text-[var(--color-muted)]">
              Agrega telefono al cliente para usar WhatsApp
            </div>
          )}

          {quote.status === "draft" ? (
            <form action={sendAction} className="flex-1">
              <button
                type="submit"
                className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--color-brand-soft),var(--color-brand))] px-4 text-sm font-semibold text-white shadow-[0_14px_28px_var(--color-brand-shadow)] [&_svg]:text-white [&_svg]:stroke-white"
              >
                <span className="text-white">Enviar cotizacion</span>
              </button>
            </form>
          ) : null}

          {quote.status === "sent" ? (
            <>
              <form action={approveAction} className="flex-1">
                <button
                  type="submit"
                  className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--color-brand-soft),var(--color-brand))] px-4 text-sm font-semibold text-white shadow-[0_14px_28px_var(--color-brand-shadow)] [&_svg]:text-white [&_svg]:stroke-white"
                >
                  <span className="text-white">Aprobar cotizacion</span>
                </button>
              </form>
              <form action={rejectAction} className="flex-1">
                <button
                  type="submit"
                  className="inline-flex min-h-12 w-full items-center justify-center rounded-full border border-rose-200 bg-rose-50 px-4 text-sm font-semibold text-rose-800"
                >
                  <span>Rechazar cotizacion</span>
                </button>
              </form>
            </>
          ) : null}

          {quote.status === "approved" && !existingOrderId ? (
            <form action={createOrderAction} className="flex-1">
              <button
                type="submit"
                className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--color-brand-soft),var(--color-brand))] px-4 text-sm font-semibold text-white shadow-[0_14px_28px_var(--color-brand-shadow)] [&_svg]:text-white [&_svg]:stroke-white"
              >
                <span className="text-white">Crear pedido</span>
              </button>
            </form>
          ) : null}

          {existingOrderId ? (
            <Link
              href={`/pedidos/${existingOrderId}`}
              className="inline-flex min-h-12 flex-1 items-center justify-center rounded-full border border-[var(--color-line)] bg-[var(--color-panel)] px-4 text-sm font-semibold text-[var(--color-ink)]"
            >
              Ver pedido creado
            </Link>
          ) : null}
        </div>
        <div className="mt-4 border-t border-[var(--color-line)] pt-4">
          {canDeleteQuote ? (
            <form action={deleteAction}>
              <ConfirmSubmitButton
                label="Borrar cotizacion"
                pendingLabel="Borrando..."
                confirmMessage="Esta accion eliminara la cotizacion y sus items relacionados. Deseas continuar?"
                className="inline-flex min-h-12 w-full items-center justify-center rounded-full border border-rose-200 bg-rose-50 px-4 text-sm font-semibold text-rose-800 disabled:opacity-70"
              />
            </form>
          ) : (
            <div className="rounded-2xl border border-dashed border-[var(--color-line-strong)] bg-[var(--color-panel)] px-4 py-3 text-sm text-[var(--color-muted)]">
              Esta cotizacion ya esta ligada a un pedido y no se puede borrar.
            </div>
          )}
        </div>
      </section>

      <section className="grid gap-3 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-3">
          <article className="rounded-[1.6rem] border border-[var(--color-line)] bg-[var(--color-elevated)] p-4 shadow-[var(--shadow-soft)]">
            <div className="flex items-center gap-2 text-sm font-semibold text-[var(--color-ink)]">
              <UserRound className="h-4 w-4 text-[var(--color-brand)]" />
              Cliente
            </div>
            <div className="mt-3 text-sm text-[var(--color-muted)]">
              <p className="font-semibold text-[var(--color-ink)]">
                {quote.clients?.name || "Cliente sin nombre"}
              </p>
              <p>{quote.clients?.phone || "Sin telefono registrado"}</p>
              {quote.clients?.email ? <p>{quote.clients.email}</p> : null}
            </div>
          </article>

          <article className="rounded-[1.6rem] border border-[var(--color-line)] bg-[var(--color-elevated)] p-4 shadow-[var(--shadow-soft)]">
            <div className="flex items-center gap-2 text-sm font-semibold text-[var(--color-ink)]">
              <ReceiptText className="h-4 w-4 text-[var(--color-brand)]" />
              Items
            </div>
            <div className="mt-3 space-y-3">
              {quote.quote_items.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-panel)] px-4 py-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[var(--color-ink)]">
                        {item.description}
                      </p>
                      <p className="mt-1 text-xs text-[var(--color-muted)]">
                        {item.quantity} x{" "}
                        {formatCurrency(item.unit_price_amount, settings.currency_code)}
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-[var(--color-ink)]">
                      {formatCurrency(item.line_subtotal_amount, settings.currency_code)}
                    </p>
                  </div>
                  {item.specifications ? (
                    <div className="mt-3 rounded-xl bg-[var(--color-elevated)] px-3 py-2 text-xs leading-5 text-[var(--color-muted)]">
                      <span className="font-semibold text-[var(--color-ink)]">
                        Especificaciones:
                      </span>{" "}
                      {item.specifications}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </article>
        </div>

        <aside className="space-y-3">
          <section className="rounded-[1.6rem] border border-[var(--color-line)] bg-[var(--color-elevated)] p-4 shadow-[var(--shadow-soft)]">
            <h2 className="text-sm font-semibold text-[var(--color-ink)]">
              Resumen de importes
            </h2>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between gap-3 text-[var(--color-muted)]">
                <span>Subtotal</span>
                <span className="font-semibold text-[var(--color-ink)]">
                  {formatCurrency(quote.subtotal_amount, settings.currency_code)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3 text-[var(--color-muted)]">
                <span>IVA</span>
                <span className="font-semibold text-[var(--color-ink)]">
                  {formatCurrency(quote.vat_amount, settings.currency_code)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3 text-[var(--color-muted)]">
                <span>Total</span>
                <span className="font-semibold text-[var(--color-ink)]">
                  {formatCurrency(quote.total_amount, settings.currency_code)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-2xl bg-[var(--color-panel)] px-4 py-3">
                <span className="text-[var(--color-muted)]">
                  Anticipo sugerido ({COMMERCIAL_DOWN_PAYMENT_PERCENT_LABEL})
                </span>
                <span className="font-semibold text-[var(--color-ink)]">
                  {formatCurrency(
                    suggestedDownPaymentAmount,
                    settings.currency_code,
                  )}
                </span>
              </div>
            </div>
          </section>

          <section className="rounded-[1.6rem] border border-[var(--color-line)] bg-[var(--color-elevated)] p-4 shadow-[var(--shadow-soft)]">
            <h2 className="text-sm font-semibold text-[var(--color-ink)]">Notas</h2>
            <p className="mt-3 text-sm leading-6 text-[var(--color-muted)]">
              {quote.notes || "Sin notas por ahora."}
            </p>
          </section>

          <section className="rounded-[1.6rem] border border-[var(--color-line)] bg-[var(--color-elevated)] p-4 shadow-[var(--shadow-soft)]">
            <h2 className="text-sm font-semibold text-[var(--color-ink)]">
              PDF
            </h2>
            <p className="mt-3 text-sm leading-6 text-[var(--color-muted)]">
              La cotizacion ya puede abrirse en una vista integrada para revisarla,
              guardarla como PDF o compartir seguimiento con el cliente.
            </p>
            <p className="mt-3 rounded-2xl bg-[var(--color-panel)] px-4 py-3 text-sm font-medium text-[var(--color-ink)]">
              {futurePdfFilename}
            </p>
            <Link
              href={`/cotizaciones/${quote.id}/pdf`}
              className="mt-3 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[linear-gradient(135deg,var(--color-brand-soft),var(--color-brand))] px-4 text-sm font-semibold text-white shadow-[0_14px_28px_var(--color-brand-shadow)] [&_svg]:text-white [&_svg]:stroke-white"
            >
              <Download className="h-4 w-4" />
              <span className="text-white">Abrir vista PDF</span>
            </Link>
            {whatsappHref ? (
              <Link
                href={whatsappHref}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full border border-[#128C7E] bg-[linear-gradient(135deg,#25D366,#128C7E)] px-4 text-sm font-semibold text-white shadow-[0_16px_30px_rgba(18,140,126,0.28)] transition hover:brightness-[1.03] [&_svg]:text-white [&_svg]:stroke-white"
              >
                <MessageCircle className="h-4 w-4" />
                Compartir por WhatsApp
              </Link>
            ) : (
              <div className="mt-3 rounded-2xl border border-dashed border-[var(--color-line-strong)] bg-[var(--color-panel)] px-4 py-3 text-sm text-[var(--color-muted)]">
                Para compartir por WhatsApp, agrega un telefono al cliente.
              </div>
            )}
          </section>

          {quote.status === "approved" && existingOrderId ? (
            <Link
              href={`/pedidos/${existingOrderId}`}
              className="inline-flex min-h-12 w-full items-center justify-center rounded-full border border-[var(--color-line)] bg-[var(--color-panel)] px-4 text-sm font-semibold text-[var(--color-ink)]"
            >
              Ir al pedido
            </Link>
          ) : null}
        </aside>
      </section>
    </div>
  );
}
