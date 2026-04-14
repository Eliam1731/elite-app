"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import {
  getCaptureModeForOrderItem,
  getCaptureModeForSizeRow,
  getMissingPieceIndexes,
  SIZE_PENDING_VALUE,
} from "@/features/sizes/product-config";
import { maybePromoteOrderToProduction } from "@/features/orders/status-rules";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isAllowedSizeSelection } from "@/features/sizes/options";
import { getAllowedSizeOptionsForSelection } from "@/services/size-options/queries";
import { getFreshSizeTableByOrderId } from "@/services/sizes/queries";

const baseSizeRowSchema = z.object({
  size: z.string().trim().min(1, "La talla es obligatoria."),
  number: z.string().trim().min(1, "El numero es obligatorio."),
  specifications: z.string().trim().optional(),
});

const fullSizeRowSchema = baseSizeRowSchema.extend({
  player_name: z.string().trim().min(1, "El nombre es obligatorio."),
  silhouette: z.string().trim().min(1, "La silueta es obligatoria."),
  neck_type: z.string().trim().min(1, "El cuello es obligatorio."),
  has_sleeves: z.enum(["true", "false"]),
  has_cuffs: z.enum(["true", "false"]),
});

const simpleSizeRowSchema = baseSizeRowSchema;

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function getErrorDebug(error: unknown) {
  if (!error || typeof error !== "object") {
    return error;
  }

  const candidate = error as {
    message?: string;
    code?: string;
    details?: string;
    hint?: string;
  };

  return {
    message: candidate.message,
    code: candidate.code,
    details: candidate.details,
    hint: candidate.hint,
  };
}

async function ensureSizeTable(orderId: string, clientId: string) {
  const supabase = createServerSupabaseClient();

  if (!supabase) {
    return null;
  }

  const existing = await getFreshSizeTableByOrderId(orderId);

  if (existing) {
    return existing.id;
  }

  const { data, error } = await supabase
    .from("size_tables")
    .insert({
      order_id: orderId,
      client_id: clientId,
      title: "Tabla principal",
      notes: null,
    })
    .select("id")
    .single();

  if (error || !data) {
    console.error("Error creating size_table", {
      orderId,
      clientId,
      error: getErrorDebug(error),
    });
    return null;
  }

  return data.id;
}

function getOrderTallasHref(orderId: string, message: string, extra?: string) {
  const query = extra ? `message=${message}&${extra}` : `message=${message}`;
  return `/pedidos/${orderId}?${query}#tallas`;
}

async function getValidatedSizeRowForOrder(orderId: string, rowId: string) {
  const supabase = createServerSupabaseClient();

  if (!supabase) {
    return null;
  }

  const { data: row, error: rowError } = await supabase
    .from("size_table_rows")
    .select("*")
    .eq("id", rowId)
    .single();

  if (rowError || !row) {
    console.error("Error loading size row", {
      orderId,
      rowId,
      error: getErrorDebug(rowError),
    });
    return null;
  }

  const { data: sizeTable, error: sizeTableError } = await supabase
    .from("size_tables")
    .select("order_id")
    .eq("id", row.size_table_id)
    .single();

  if (sizeTableError || !sizeTable || sizeTable.order_id !== orderId) {
    console.error("Size row does not belong to order", {
      orderId,
      rowId,
      sizeTableId: row.size_table_id,
      error: getErrorDebug(sizeTableError),
    });
    return null;
  }

  return row;
}

export async function generateSizeRowsForItemAction(
  orderId: string,
  clientId: string,
  orderItemId: string,
) {
  const supabase = createServerSupabaseClient();

  if (!supabase) {
    redirect(getOrderTallasHref(orderId, "config"));
  }

  const { data: orderItem, error: orderItemError } = await supabase
    .from("order_items")
    .select("*, product:products(id, name, capture_mode)")
    .eq("id", orderItemId)
    .eq("order_id", orderId)
    .single();

  if (orderItemError || !orderItem) {
    console.error("Error loading order_item for sizes", {
      orderId,
      orderItemId,
      error: getErrorDebug(orderItemError),
    });
    redirect(getOrderTallasHref(orderId, "size-item-error"));
  }

  const captureMode = getCaptureModeForOrderItem(orderItem);

  if (!captureMode) {
    redirect(getOrderTallasHref(orderId, "size-item-unsupported"));
  }

  const sizeTableId = await ensureSizeTable(orderId, clientId);

  if (!sizeTableId) {
    redirect(getOrderTallasHref(orderId, "size-table-error"));
  }

  const currentTable = await getFreshSizeTableByOrderId(orderId);
  const currentRows = currentTable?.size_table_rows ?? [];
  const currentRowsForItem = currentRows.filter((row) => row.order_item_id === orderItem.id);
  const missingPieceIndexes = getMissingPieceIndexes(orderItem.quantity, currentRowsForItem);

  if (missingPieceIndexes.length === 0) {
    redirect(getOrderTallasHref(orderId, "size-rows-current"));
  }

  let nextSortOrder =
    currentRows.reduce((max, row) => Math.max(max, row.sort_order), 0) + 1;

  const payload = missingPieceIndexes.map((pieceIndex) => ({
    size_table_id: sizeTableId,
    order_item_id: orderItem.id,
    piece_index: pieceIndex,
    product_name: orderItem.product?.name ?? orderItem.description,
    capture_mode: captureMode,
    player_name: SIZE_PENDING_VALUE,
    number: SIZE_PENDING_VALUE,
    size: SIZE_PENDING_VALUE,
    silhouette: null,
    neck_type: null,
    has_sleeves: null,
    has_cuffs: null,
    specifications: null,
    sort_order: nextSortOrder++,
  }));

  const { error } = await supabase.from("size_table_rows").insert(payload);

  if (error) {
    console.error("Error generating base size rows", {
      orderId,
      clientId,
      orderItemId,
      sizeTableId,
      payload,
      error: getErrorDebug(error),
    });
    redirect(getOrderTallasHref(orderId, "size-row-error"));
  }

  revalidatePath(`/pedidos/${orderId}`);
  redirect(getOrderTallasHref(orderId, "size-rows-generated"));
}

export async function updateSizeRowAction(
  orderId: string,
  rowId: string,
  formData: FormData,
) {
  const supabase = createServerSupabaseClient();

  if (!supabase) {
    redirect(getOrderTallasHref(orderId, "config"));
  }

  const existingRow = await getValidatedSizeRowForOrder(orderId, rowId);

  if (!existingRow) {
    redirect(getOrderTallasHref(orderId, "size-row-error"));
  }

  if (getCaptureModeForSizeRow(existingRow) === "simple") {
    const allowedOptions = await getAllowedSizeOptionsForSelection(
      "simple",
      existingRow.size,
    );

    const parsed = simpleSizeRowSchema.safeParse({
      size: getString(formData, "size"),
      number: getString(formData, "number"),
      specifications: getString(formData, "specifications"),
    });

    if (!parsed.success) {
      redirect(getOrderTallasHref(orderId, "size-row-invalid", `editRow=${rowId}`));
    }

    if (!isAllowedSizeSelection(parsed.data.size, allowedOptions, existingRow.size)) {
      redirect(getOrderTallasHref(orderId, "size-row-invalid", `editRow=${rowId}`));
    }

    const { error } = await supabase
      .from("size_table_rows")
      .update({
        size: parsed.data.size,
        number: parsed.data.number,
        specifications: parsed.data.specifications || null,
        player_name: SIZE_PENDING_VALUE,
        silhouette: null,
        neck_type: null,
        has_sleeves: null,
        has_cuffs: null,
      })
      .eq("id", rowId);

    if (error) {
      console.error("Error updating simple size row", {
        orderId,
        rowId,
        error: getErrorDebug(error),
      });
      redirect(getOrderTallasHref(orderId, "size-row-error", `editRow=${rowId}`));
    }
  } else {
    const allowedOptions = await getAllowedSizeOptionsForSelection(
      "full",
      existingRow.size,
    );

    const parsed = fullSizeRowSchema.safeParse({
      size: getString(formData, "size"),
      number: getString(formData, "number"),
      player_name: getString(formData, "player_name"),
      silhouette: getString(formData, "silhouette"),
      neck_type: getString(formData, "neck_type"),
      has_sleeves: getString(formData, "has_sleeves"),
      has_cuffs: getString(formData, "has_cuffs"),
      specifications: getString(formData, "specifications"),
    });

    if (!parsed.success) {
      redirect(getOrderTallasHref(orderId, "size-row-invalid", `editRow=${rowId}`));
    }

    if (!isAllowedSizeSelection(parsed.data.size, allowedOptions, existingRow.size)) {
      redirect(getOrderTallasHref(orderId, "size-row-invalid", `editRow=${rowId}`));
    }

    const { error } = await supabase
      .from("size_table_rows")
      .update({
        size: parsed.data.size,
        number: parsed.data.number,
        player_name: parsed.data.player_name,
        silhouette: parsed.data.silhouette,
        neck_type: parsed.data.neck_type,
        has_sleeves: parsed.data.has_sleeves === "true",
        has_cuffs: parsed.data.has_cuffs === "true",
        specifications: parsed.data.specifications || null,
      })
      .eq("id", rowId);

    if (error) {
      console.error("Error updating full size row", {
        orderId,
        rowId,
        error: getErrorDebug(error),
      });
      redirect(getOrderTallasHref(orderId, "size-row-error", `editRow=${rowId}`));
    }
  }

  await maybePromoteOrderToProduction(orderId);

  revalidatePath(`/pedidos/${orderId}`);
  redirect(getOrderTallasHref(orderId, "size-row-updated"));
}

export async function deleteSizeRowAction(orderId: string, rowId: string) {
  const supabase = createServerSupabaseClient();

  if (!supabase) {
    redirect(getOrderTallasHref(orderId, "config"));
  }

  const existingRow = await getValidatedSizeRowForOrder(orderId, rowId);

  if (!existingRow) {
    redirect(getOrderTallasHref(orderId, "size-row-error"));
  }

  const { error } = await supabase.from("size_table_rows").delete().eq("id", rowId);

  if (error) {
    console.error("Error deleting size row", {
      orderId,
      rowId,
      error: getErrorDebug(error),
    });
    redirect(getOrderTallasHref(orderId, "size-row-error"));
  }

  revalidatePath(`/pedidos/${orderId}`);
  redirect(getOrderTallasHref(orderId, "size-row-deleted"));
}
