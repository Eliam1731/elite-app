import Link from "next/link";
import { CalendarDays, FileText } from "lucide-react";

import { formatCurrency, formatDate } from "@/features/quotes/calculations";
import type { QuoteListRecord } from "@/types/database";

type QuoteCardProps = {
  quote: QuoteListRecord;
  currencyCode: string;
};

const statusLabel: Record<QuoteListRecord["status"], string> = {
  draft: "Borrador",
  sent: "Enviada",
  approved: "Aprobada",
  rejected: "Rechazada",
};

const statusClasses: Record<QuoteListRecord["status"], string> = {
  draft: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
  sent: "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-200",
  approved: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200",
  rejected: "bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-200",
};

export function QuoteCard({ quote, currencyCode }: QuoteCardProps) {
  return (
    <Link
      href={`/cotizaciones/${quote.id}`}
      className="rounded-[1.6rem] border border-[var(--color-line)] bg-[var(--color-elevated)] p-4 shadow-[var(--shadow-soft)] transition hover:border-[var(--color-line-strong)] hover:shadow-[0_18px_38px_rgba(15,23,42,0.12)]"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,var(--color-brand-soft),var(--color-brand))] text-white shadow-[0_14px_26px_var(--color-brand-shadow)]">
          <FileText className="h-5 w-5 text-white stroke-white" />
        </div>
        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-[var(--color-ink)]">
                {quote.clients?.name || "Cliente sin nombre"}
              </p>
              <p className="mt-1 truncate text-xs text-[var(--color-muted)]">
                {quote.folio}
              </p>
            </div>
            <span
              className={`rounded-full px-3 py-1 text-[11px] font-semibold ${statusClasses[quote.status]}`}
            >
              {statusLabel[quote.status]}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs text-[var(--color-muted)] md:grid-cols-4">
            <div className="rounded-2xl bg-[var(--color-panel)] px-3 py-2">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--color-soft-muted)]">
                Tipo
              </p>
              <p className="mt-1 text-sm font-semibold text-[var(--color-ink)]">
                {quote.sale_type === "factura" ? "Factura" : "Normal"}
              </p>
            </div>
            <div className="rounded-2xl bg-[var(--color-panel)] px-3 py-2">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--color-soft-muted)]">
                Total
              </p>
              <p className="mt-1 text-sm font-semibold text-[var(--color-ink)]">
                {formatCurrency(quote.total_amount, currencyCode)}
              </p>
            </div>
            <div className="rounded-2xl bg-[var(--color-panel)] px-3 py-2">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--color-soft-muted)]">
                Fecha
              </p>
              <div className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-[var(--color-ink)]">
                <CalendarDays className="h-3.5 w-3.5 text-[var(--color-brand)]" />
                <span>{formatDate(quote.created_at)}</span>
              </div>
            </div>
            <div className="rounded-2xl bg-[var(--color-panel)] px-3 py-2">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--color-soft-muted)]">
                Cliente
              </p>
              <p className="mt-1 truncate text-sm font-semibold text-[var(--color-ink)]">
                {quote.clients?.phone || "Sin telefono"}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-[var(--color-line)] pt-3">
            <p className="text-xs text-[var(--color-muted)]">
              Ver detalle de la cotizacion
            </p>
            <p className="text-sm font-semibold text-[var(--color-brand)]">
              {quote.folio}
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}
