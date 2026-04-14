"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { isDueDateTodayOrLater } from "@/features/orders/due-date";
import { getOrderProductionReadiness } from "@/features/orders/status-rules";
import {
  canonicalOrderStatuses,
  isCanonicalOrderStatus,
} from "@/features/orders/status";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type OrderStatus = (typeof canonicalOrderStatuses)[number];

const dueDateSchema = z.object({
  due_date: z.string().trim().optional(),
});

export async function updateOrderStatusAction(
  orderId: string,
  status: OrderStatus,
) {
  if (!isCanonicalOrderStatus(status)) {
    redirect(`/pedidos/${orderId}?message=status-error`);
  }

  const supabase = createServerSupabaseClient();

  if (!supabase) {
    redirect(`/pedidos/${orderId}?message=config`);
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

  const { error } = await supabase
    .from("orders")
    .update({
      status,
    })
    .eq("id", orderId);

  if (error) {
    redirect(`/pedidos/${orderId}?message=status-error`);
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
