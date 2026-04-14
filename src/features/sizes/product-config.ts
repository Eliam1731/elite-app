import { PRODUCT_OPTIONS } from "@/features/products/catalog";
import { getCaptureModeFromProductName } from "@/features/products/rules";
import type {
  OrderItemRecord,
  OrderItemWithProductRecord,
  SizeTableRowRecord,
} from "@/types/database";

export const SIZE_PENDING_VALUE = "POR DEFINIR";

export const SIMPLE_CAPTURE_PRODUCTS = ["Short", "Licra", "Pants"] as const;

export const FULL_CAPTURE_PRODUCTS = PRODUCT_OPTIONS.filter(
  (product) => !SIMPLE_CAPTURE_PRODUCTS.includes(product as (typeof SIMPLE_CAPTURE_PRODUCTS)[number]),
);

export type CaptureMode = "full" | "simple";

const PRODUCT_NAME_ALIASES: Record<string, string> = {
  jersey: "playera",
  jeersey: "playera",
};

function normalizeProductName(value: string) {
  return value
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map((token) => PRODUCT_NAME_ALIASES[token] ?? token)
    .join(" ");
}

export function getCaptureModeForProduct(productName: string): CaptureMode | null {
  const normalized = normalizeProductName(productName);

  if (SIMPLE_CAPTURE_PRODUCTS.some((product) => normalizeProductName(product) === normalized)) {
    return "simple";
  }

  if (FULL_CAPTURE_PRODUCTS.some((product) => normalizeProductName(product) === normalized)) {
    return "full";
  }

  return null;
}

export function getCaptureModeForSizeRow(
  row: Pick<SizeTableRowRecord, "capture_mode" | "product_name">,
): CaptureMode | null {
  const inferredMode = row.product_name
    ? getCaptureModeForProduct(row.product_name)
    : null;

  if (inferredMode === "simple") {
    return "simple";
  }

  if (row.capture_mode) {
    return row.capture_mode;
  }

  if (row.product_name) {
    return getCaptureModeFromProductName(row.product_name);
  }

  return null;
}

export function getCaptureModeForOrderItem(
  orderItem: Pick<OrderItemRecord, "description"> & {
    product?: { capture_mode: CaptureMode | null; name?: string | null } | null;
  },
): CaptureMode | null {
  if (orderItem.product?.capture_mode) {
    return orderItem.product.capture_mode;
  }

  const productName = orderItem.product?.name ?? orderItem.description;
  return getCaptureModeForProduct(productName);
}

export function isSupportedSizeProduct(productName: string) {
  return getCaptureModeForProduct(productName) !== null;
}

export function isSupportedSizeOrderItem(orderItem: Pick<
  OrderItemWithProductRecord,
  "description" | "product"
>) {
  return getCaptureModeForOrderItem(orderItem) !== null;
}

export function isPendingValue(value: string | null | undefined) {
  return !value || value.trim() === "" || value.trim().toUpperCase() === SIZE_PENDING_VALUE;
}

export function isSizeRowComplete(row: SizeTableRowRecord) {
  if (isPendingValue(row.size) || isPendingValue(row.number)) {
    return false;
  }

  if (getCaptureModeForSizeRow(row) === "simple") {
    return true;
  }

  return (
    !isPendingValue(row.player_name) &&
    !isPendingValue(row.silhouette) &&
    !isPendingValue(row.neck_type) &&
    row.has_sleeves !== null &&
    row.has_cuffs !== null
  );
}

export function getRowsForOrderItem(
  orderItem: Pick<OrderItemRecord, "id">,
  rows: SizeTableRowRecord[],
) {
  return rows
    .filter((row) => row.order_item_id === orderItem.id)
    .sort((a, b) => {
      const pieceDiff = (a.piece_index ?? Number.MAX_SAFE_INTEGER) -
        (b.piece_index ?? Number.MAX_SAFE_INTEGER);

      if (pieceDiff !== 0) {
        return pieceDiff;
      }

      return a.sort_order - b.sort_order;
    });
}

export function getMissingPieceIndexes(
  expectedQuantity: number,
  rows: SizeTableRowRecord[],
) {
  const existingIndexes = new Set(
    rows
      .map((row) => row.piece_index)
      .filter(
        (pieceIndex): pieceIndex is number =>
          typeof pieceIndex === "number" &&
          Number.isInteger(pieceIndex) &&
          pieceIndex > 0,
      ),
  );

  return Array.from({ length: expectedQuantity }, (_, index) => index + 1).filter(
    (pieceIndex) => !existingIndexes.has(pieceIndex),
  );
}
