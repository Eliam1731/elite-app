import { getTodayForDateInput } from "@/features/orders/due-date";
import type {
  CanonicalOrderStatus,
  OrderRecord,
  OrderStatusRecord,
} from "@/types/database";

export const canonicalOrderStatuses = [
  "borrador",
  "aprobado",
  "en_produccion",
  "listo",
  "entregado",
  "cancelado",
] as const satisfies CanonicalOrderStatus[];

const legacyToCanonicalStatus: Record<OrderStatusRecord, CanonicalOrderStatus> = {
  borrador: "borrador",
  aprobado: "aprobado",
  en_produccion: "en_produccion",
  listo: "listo",
  entregado: "entregado",
  cancelado: "cancelado",
  new: "aprobado",
  in_production: "en_produccion",
  ready: "listo",
  delivered: "entregado",
  cancelled: "cancelado",
};

const orderStatusLabels: Record<CanonicalOrderStatus, string> = {
  borrador: "Borrador",
  aprobado: "Aprobado",
  en_produccion: "En produccion",
  listo: "Listo",
  entregado: "Entregado",
  cancelado: "Cancelado",
};

const orderStatusClasses: Record<CanonicalOrderStatus, string> = {
  borrador: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
  aprobado: "bg-cyan-100 text-cyan-800 dark:bg-cyan-950/50 dark:text-cyan-200",
  en_produccion:
    "bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-200",
  listo: "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-200",
  entregado:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200",
  cancelado: "bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-200",
};

export function normalizeOrderStatus(status: OrderStatusRecord): CanonicalOrderStatus {
  return legacyToCanonicalStatus[status] ?? "borrador";
}

export function getOrderStatusLabel(status: OrderStatusRecord) {
  return orderStatusLabels[normalizeOrderStatus(status)];
}

export function getOrderStatusClasses(status: OrderStatusRecord) {
  return orderStatusClasses[normalizeOrderStatus(status)];
}

export function isCanonicalOrderStatus(value: string): value is CanonicalOrderStatus {
  return canonicalOrderStatuses.includes(value as CanonicalOrderStatus);
}

export function isClosedOrderStatus(status: OrderStatusRecord) {
  const normalized = normalizeOrderStatus(status);
  return normalized === "entregado" || normalized === "cancelado";
}

export function isOrderOverdue(
  order: Pick<OrderRecord, "status" | "due_date">,
  today = getTodayForDateInput(),
) {
  if (!order.due_date || isClosedOrderStatus(order.status)) {
    return false;
  }

  return order.due_date < today;
}

export function matchesOrderStatusFilter(
  status: OrderStatusRecord,
  filter?: CanonicalOrderStatus,
) {
  if (!filter) {
    return true;
  }

  return normalizeOrderStatus(status) === filter;
}
