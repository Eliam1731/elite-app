import type { QuoteItemFormValue } from "@/features/quotes/form-state";

type MoneyInput = number | string | null | undefined;

export const COMMERCIAL_DOWN_PAYMENT_RATE = 0.5;
export const COMMERCIAL_DOWN_PAYMENT_PERCENT_LABEL = "50%";
export const PRODUCTION_MIN_PAYMENT_RATE = 0.3;
export const PRODUCTION_MIN_PAYMENT_PERCENT_LABEL = "30%";

function normalizeMoneyString(value: string) {
  return value
    .trim()
    .replace(/[$,\s]/g, "")
    .replace(/[^\d.-]/g, "");
}

export function moneyToCents(value: MoneyInput) {
  if (value === null || value === undefined || value === "") {
    return 0;
  }

  const normalized =
    typeof value === "number" ? value.toFixed(6) : normalizeMoneyString(String(value));

  if (!normalized || normalized === "-" || Number.isNaN(Number(normalized))) {
    return 0;
  }

  const negative = normalized.startsWith("-");
  const unsigned = negative ? normalized.slice(1) : normalized;
  const [wholePartRaw, decimalPartRaw = ""] = unsigned.split(".");
  const wholePart = wholePartRaw === "" ? "0" : wholePartRaw;
  const decimalPart = `${decimalPartRaw}00`.slice(0, 3);
  const cents =
    Number.parseInt(wholePart, 10) * 100 +
    Number.parseInt(decimalPart.slice(0, 2), 10) +
    (Number.parseInt(decimalPart[2] ?? "0", 10) >= 5 ? 1 : 0);

  return negative ? -cents : cents;
}

export function centsToMoney(cents: number) {
  return cents / 100;
}

export function roundCurrency(value: MoneyInput) {
  return centsToMoney(moneyToCents(value));
}

export function getLineSubtotal(quantity: number, unitPrice: number) {
  return centsToMoney(quantity * moneyToCents(unitPrice));
}

export function sumMoney(values: MoneyInput[]) {
  const totalCents = values.reduce<number>((sum, value) => {
    return sum + moneyToCents(value);
  }, 0);

  return centsToMoney(totalCents);
}

export function getCommercialDownPaymentAmount(totalAmount: MoneyInput) {
  return roundCurrency(roundCurrency(totalAmount) * COMMERCIAL_DOWN_PAYMENT_RATE);
}

export function getProductionMinimumPaymentAmount(totalAmount: MoneyInput) {
  return roundCurrency(roundCurrency(totalAmount) * PRODUCTION_MIN_PAYMENT_RATE);
}

export function getQuoteSummary(args: {
  items: QuoteItemFormValue[];
  saleType: "normal" | "factura";
  vatRate: number;
}) {
  const subtotal = centsToMoney(
    args.items.reduce((total, item) => {
      return total + item.quantity * moneyToCents(item.unit_price_amount);
    }, 0),
  );

  const vatAmount =
    args.saleType === "factura" ? roundCurrency(subtotal * args.vatRate) : 0;

  const total = roundCurrency(subtotal + vatAmount);
  const suggestedDownPaymentAmount = getCommercialDownPaymentAmount(total);

  return {
    subtotal,
    vatAmount,
    total,
    suggestedDownPaymentAmount,
  };
}

export function formatCurrency(amount: MoneyInput, currencyCode = "MXN") {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: currencyCode,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(roundCurrency(amount));
}

export function formatDate(dateString: string) {
  return new Intl.DateTimeFormat("es-MX", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(dateString));
}

export function buildDocumentFilename(args: {
  clientName: string;
  date: string;
  documentType: "cotizacion" | "pedido" | "tallas";
}) {
  const safeClientName = args.clientName
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

  const isoDate = new Date(args.date).toISOString().slice(0, 10);

  return `${safeClientName || "cliente"}_${isoDate}_${args.documentType}.pdf`;
}
