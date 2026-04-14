import { revalidatePath } from "next/cache";

import {
  getOrderStatusWriteCandidates,
  isOrderStatusCompatibilityError,
  normalizeOrderStatus,
} from "@/features/orders/status";
import { roundCurrency } from "@/features/quotes/calculations";
import {
  getMissingPieceIndexes,
  getRowsForOrderItem,
  isSizeRowComplete,
  isSupportedSizeOrderItem,
} from "@/features/sizes/product-config";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getFreshSizeTableByOrderId } from "@/services/sizes/queries";
import type {
  OrderDetailRecord,
  OrderItemWithProductRecord,
  SizeTableRowRecord,
} from "@/types/database";

type OrderProductionReadiness = {
  order: Pick<OrderDetailRecord, "id" | "status" | "expected_down_payment_amount"> & {
    order_items: OrderItemWithProductRecord[];
  };
  hasDownPayment: boolean;
  hasCompleteSizes: boolean;
};

function isOrderItemReadyForProduction(
  item: OrderItemWithProductRecord,
  allRows: SizeTableRowRecord[],
) {
  const rows = getRowsForOrderItem(item, allRows);
  const missingPieceIndexes = getMissingPieceIndexes(item.quantity, rows);

  if (missingPieceIndexes.length > 0) {
    return false;
  }

  return Array.from({ length: item.quantity }, (_, index) => index + 1).every(
    (pieceIndex) =>
      rows.some((row) => row.piece_index === pieceIndex && isSizeRowComplete(row)),
  );
}

export async function getOrderProductionReadiness(
  orderId: string,
): Promise<OrderProductionReadiness | null> {
  const supabase = createServerSupabaseClient();

  if (!supabase) {
    return null;
  }

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("id, status, expected_down_payment_amount, order_items(*, product:products(*))")
    .eq("id", orderId)
    .single();

  if (orderError || !order) {
    return null;
  }

  const { data: payments, error: paymentsError } = await supabase
    .from("payments")
    .select("amount")
    .eq("order_id", orderId);

  if (paymentsError) {
    return null;
  }

  const totalPaid = roundCurrency(
    (payments ?? []).reduce((sum, payment) => sum + Number(payment.amount ?? 0), 0),
  );
  const hasDownPayment =
    roundCurrency(order.expected_down_payment_amount) <= 0 ||
    totalPaid >= roundCurrency(order.expected_down_payment_amount);

  const sizeTable = await getFreshSizeTableByOrderId(orderId);
  const allRows = sizeTable?.size_table_rows ?? [];
  const supportedItems = (order.order_items ?? []).filter(isSupportedSizeOrderItem);
  const hasCompleteSizes =
    supportedItems.length === 0 ||
    supportedItems.every((item) => isOrderItemReadyForProduction(item, allRows));

  return {
    order,
    hasDownPayment,
    hasCompleteSizes,
  };
}

export async function maybePromoteOrderToProduction(orderId: string) {
  const readiness = await getOrderProductionReadiness(orderId);

  if (!readiness) {
    return false;
  }

  if (normalizeOrderStatus(readiness.order.status) !== "aprobado") {
    return false;
  }

  if (!readiness.hasDownPayment || !readiness.hasCompleteSizes) {
    return false;
  }

  const supabase = createServerSupabaseClient();

  if (!supabase) {
    return false;
  }

  for (const candidate of getOrderStatusWriteCandidates("en_produccion")) {
    const { error } = await supabase
      .from("orders")
      .update({
        status: candidate,
      })
      .eq("id", orderId);

    if (!error) {
      revalidatePath("/pedidos");
      revalidatePath(`/pedidos/${orderId}`);
      return true;
    }

    if (!isOrderStatusCompatibilityError(error)) {
      return false;
    }
  }

  return false;
}
