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
