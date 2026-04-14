import { formatCurrency } from "@/features/quotes/calculations";
import type { QuoteDetailRecord } from "@/types/database";

function normalizeWhatsAppNumber(phone: string) {
  const digits = phone.replace(/\D/g, "");

  if (!digits) {
    return "";
  }

  if (digits.length === 10) {
    return `52${digits}`;
  }

  return digits;
}

export function getQuoteWhatsAppLink(
  quote: QuoteDetailRecord,
  currencyCode = "MXN",
) {
  const phone = normalizeWhatsAppNumber(quote.clients?.phone ?? "");

  if (!phone) {
    return null;
  }

  const message = [
    `Hola ${quote.clients?.name || ""}`.trim(),
    `le comparto Su cotizacion ${quote.folio} de Elite.`,
    `Total: ${formatCurrency(quote.total_amount, currencyCode)}.`,
    "Si gusta, le envio el PDF y damos seguimiento por este medio.",
  ].join("\n");

  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}
