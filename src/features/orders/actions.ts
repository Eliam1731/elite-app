"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { isDueDateTodayOrLater } from "@/features/orders/due-date";
import { getOrderProductionReadiness } from "@/features/orders/status-rules";
import {
  canonicalOrderStatuses,
  getOrderStatusWriteCandidates,
  isOrderStatusCompatibilityError,
  isCanonicalOrderStatus,
  normalizeOrderStatus,
} from "@/features/orders/status";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type OrderStatus = (typeof canonicalOrderStatuses)[number];

const dueDateSchema = z.object({
  due_date: z.string().trim().optional(),
});

async function updateOrderStatusWithCompatibility(
  orderId: string,
  status: OrderStatus,
) {
  const supabase = createServerSupabaseClient();

  if (!supabase) {
    return {
      success: false as const,
      reason: "config" as const,
    };
  }

  let lastError: {
    message?: string;
    code?: string;
    details?: string;
    hint?: string;
  } | null = null;

  for (const candidate of getOrderStatusWriteCandidates(status)) {
    const { error } = await supabase
      .from("orders")
      .update({
        status: candidate,
      })
      .eq("id", orderId);

    if (!error) {
      return { success: true as const };
    }

    lastError = {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    };

    if (!isOrderStatusCompatibilityError(error)) {
      break;
    }
  }

  console.error("Error updating order status", {
    orderId,
    status,
    error: lastError,
  });

  return {
    success: false as const,
    reason: "error" as const,
    detail: lastError?.message,
  };
}

export async function updateOrderStatusAction(
  orderId: string,
  status: OrderStatus,
) {
  if (!isCanonicalOrderStatus(status)) {
    redirect(`/pedidos/${orderId}?message=status-error`);
  }

  if (status === "en_produccion") {
    const readiness = await getOrderProductionReadiness(orderId);

    if (!readiness?.hasDownPayment) {
      redirect(`/pedidos/${orderId}?message=status-needs-down-payment`);
    }

    if (!readiness.hasCompleteSizes) {
      redirect(`/pedidos/${orderId}?message=status-needs-sizes`);
    }
  }

  const result = await updateOrderStatusWithCompatibility(orderId, status);

  if (!result.success) {
    if (result.reason === "config") {
      redirect(`/pedidos/${orderId}?message=config`);
    }

    const detail = result.detail
      ? `&detail=${encodeURIComponent(result.detail.slice(0, 180))}`
      : "";
    redirect(`/pedidos/${orderId}?message=status-error${detail}`);
  }

  revalidatePath("/pedidos");
  revalidatePath(`/pedidos/${orderId}`);
  redirect(`/pedidos/${orderId}?message=status-updated`);
}

export async function updateOrderDueDateAction(orderId: string, formData: FormData) {
  const parsed = dueDateSchema.safeParse({
    due_date: (() => {
      const value = formData.get("due_date");
      return typeof value === "string" ? value : "";
    })(),
  });

  if (!parsed.success) {
    redirect(`/pedidos/${orderId}?message=due-date-error`);
  }

  const supabase = createServerSupabaseClient();

  if (!supabase) {
    redirect(`/pedidos/${orderId}?message=config`);
  }

  const dueDateValue = parsed.data.due_date ? parsed.data.due_date : null;

  if (dueDateValue && !isDueDateTodayOrLater(dueDateValue)) {
    redirect(`/pedidos/${orderId}?message=due-date-invalid`);
  }

  const { error } = await supabase
    .from("orders")
    .update({
      due_date: dueDateValue,
    })
    .eq("id", orderId);

  if (error) {
    console.error("Error updating order due date", {
      orderId,
      dueDate: dueDateValue,
      error,
    });
    redirect(`/pedidos/${orderId}?message=due-date-error`);
  }

  revalidatePath("/pedidos");
  revalidatePath(`/pedidos/${orderId}`);
  redirect(`/pedidos/${orderId}?message=due-date-updated`);
}

async function deleteFromOptionalTable(
  tableName: "order_costs" | "shipping_expenses",
  orderId: string,
) {
  const supabase = createServerSupabaseClient();

  if (!supabase) {
    return { success: false as const, reason: "config" as const };
  }

  const { error } = await supabase.from(tableName).delete().eq("order_id", orderId);

  if (!error) {
    return { success: true as const };
  }

  if (error.code === "PGRST205" || error.code === "42P01") {
    return { success: true as const };
  }

  return {
    success: false as const,
    reason: "error" as const,
    detail: error.message,
  };
}

export async function deleteOrderAction(orderId: string) {
  const supabase = createServerSupabaseClient();

  if (!supabase) {
    redirect(`/pedidos/${orderId}?message=config`);
  }

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("id, status")
    .eq("id", orderId)
    .maybeSingle();

  if (orderError || !order) {
    console.error("Error loading order for deletion", {
      orderId,
      error: orderError,
    });
    redirect(`/pedidos/${orderId}?message=delete-error`);
  }

  const normalizedStatus = normalizeOrderStatus(order.status);

  if (
    normalizedStatus === "en_produccion" ||
    normalizedStatus === "listo" ||
    normalizedStatus === "entregado"
  ) {
    redirect(`/pedidos/${orderId}?message=delete-blocked-status`);
  }

  const [{ data: payments, error: paymentsError }, { data: sizeTables, error: sizeTablesError }] =
    await Promise.all([
      supabase.from("payments").select("id").eq("order_id", orderId),
      supabase
        .from("size_tables")
        .select("id, size_table_rows(id)")
        .eq("order_id", orderId),
    ]);

  if (paymentsError || sizeTablesError) {
    console.error("Error validating related data before order deletion", {
      orderId,
      paymentsError,
      sizeTablesError,
    });
    redirect(`/pedidos/${orderId}?message=delete-error`);
  }

  if ((payments ?? []).length > 0) {
    redirect(`/pedidos/${orderId}?message=delete-blocked-payments`);
  }

  const sizeTableIds = (sizeTables ?? []).map((table) => table.id);
  const sizeRowsCount = (sizeTables ?? []).reduce(
    (count, table) => count + ((table.size_table_rows as Array<{ id: string }> | null)?.length ?? 0),
    0,
  );

  if (sizeRowsCount > 0) {
    redirect(`/pedidos/${orderId}?message=delete-blocked-sizes`);
  }

  const optionalDeletes = await Promise.all([
    deleteFromOptionalTable("shipping_expenses", orderId),
    deleteFromOptionalTable("order_costs", orderId),
  ]);

  const failedOptionalDelete = optionalDeletes.find((result) => !result.success);

  if (failedOptionalDelete && "detail" in failedOptionalDelete) {
    console.error("Error deleting optional related records", {
      orderId,
      error: failedOptionalDelete.detail,
    });
    redirect(`/pedidos/${orderId}?message=delete-error`);
  }

  if (sizeTableIds.length > 0) {
    const { error: sizeRowsDeleteError } = await supabase
      .from("size_table_rows")
      .delete()
      .in("size_table_id", sizeTableIds);

    if (sizeRowsDeleteError) {
      console.error("Error deleting size rows", {
        orderId,
        sizeTableIds,
        error: sizeRowsDeleteError,
      });
      redirect(`/pedidos/${orderId}?message=delete-error`);
    }

    const { error: sizeTablesDeleteError } = await supabase
      .from("size_tables")
      .delete()
      .eq("order_id", orderId);

    if (sizeTablesDeleteError) {
      console.error("Error deleting size tables", {
        orderId,
        error: sizeTablesDeleteError,
      });
      redirect(`/pedidos/${orderId}?message=delete-error`);
    }
  }

  const { error: orderItemsError } = await supabase
    .from("order_items")
    .delete()
    .eq("order_id", orderId);

  if (orderItemsError) {
    console.error("Error deleting order items", {
      orderId,
      error: orderItemsError,
    });
    redirect(`/pedidos/${orderId}?message=delete-error`);
  }

  const { error: orderDeleteError } = await supabase
    .from("orders")
    .delete()
    .eq("id", orderId);

  if (orderDeleteError) {
    console.error("Error deleting order", {
      orderId,
      error: orderDeleteError,
    });
    redirect(`/pedidos/${orderId}?message=delete-error`);
  }

  revalidatePath("/pedidos");
  revalidatePath(`/pedidos/${orderId}`);
  revalidatePath("/dashboard");
  redirect("/pedidos?message=order-deleted");
}
